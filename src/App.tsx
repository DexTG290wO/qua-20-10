import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { GamePhase } from './types/game';import type { ItemReward } from './types/reward';
import type { RecipientMatchResult } from './types/recipient';
import { getRewardIntro } from './config/messages';
import { RARITY_CONFIGS } from './config/rarity';
import { determineRecipientReward } from './utils/probability';
import {
  buildCardData,
  pickPlayContent,
  EMPTY_PLAY_CONTENT,
  type PlayContent,
} from './utils/giftPlay';
import { audioEngine } from './utils/audioEngine';
import { exportCardAsImage } from './utils/exportCard';
import { isSpreadView, type CardPage } from './utils/layout';
import type { CardTextData } from './utils/cardRenderer';

// 3D Scene Components
import { SceneContainer } from './components/3d/SceneContainer';
import { CharacterSnapshot } from './components/3d/CharacterSnapshot';
import { GreetingCardOverlay, type CardMode } from './components/3d/GreetingCard3D';

// UI Components
import { IntroOverlay } from './components/ui/IntroOverlay';
import { NameInputModal } from './components/ui/NameInputModal';
import { CS2Roulette } from './components/ui/CS2Roulette';
import { SecretCutscene } from './components/ui/SecretCutscene';
import { AudioControls } from './components/ui/AudioControls';

export const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [boxClickCount, setBoxClickCount] = useState<number>(0);
  const [recipientResult, setRecipientResult] = useState<RecipientMatchResult | null>(null);
  const [wonItem, setWonItem] = useState<ItemReward | null>(null);
  const [isCardOpen, setIsCardOpen] = useState<boolean>(false);
  const [cardMode, setCardMode] = useState<CardMode>('compact');
  // Trên màn hình hẹp chỉ xem được một trang: mặc định là trang thư,
  // người dùng có thể chuyển sang trang chân dung (mặt thiệp chính).
  const [cardPage, setCardPage] = useState<CardPage>('letter');
  const [isNarrowScreen, setIsNarrowScreen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !isSpreadView(window.innerWidth / Math.max(1, window.innerHeight));
  });

  // Nội dung (tên hiển thị + lời chúc) được CHỐT một lần cho mỗi lượt chơi
  const [playContent, setPlayContent] = useState<PlayContent>(EMPTY_PLAY_CONTENT);

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [bgmPlaying, setBgmPlaying] = useState<boolean>(false);
  const [screenFlash, setScreenFlash] = useState<boolean>(false);

  const [skipToken, setSkipToken] = useState(0);
  const [replayToken, setReplayToken] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [runId, setRunId] = useState(0);
  // Chiều cao thật của thanh công cụ thiệp (px) — để thiệp 3D chừa đúng chỗ
  // trên điện thoại, nơi hàng nút có thể xuống nhiều hàng.
  const [toolbarHeightPx, setToolbarHeightPx] = useState(0);
  // Ảnh 2D của nhân vật trúng thưởng (chụp từ model 3D) để in vào trang thư.
  const [companionImageUrl, setCompanionImageUrl] = useState<string | null>(null);

  // Tôn trọng thiết lập giảm chuyển động của hệ điều hành
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Theo dõi độ rộng màn hình để biết khi nào chỉ xem được MỘT trang thiệp
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () =>
      setIsNarrowScreen(!isSpreadView(window.innerWidth / Math.max(1, window.innerHeight)));
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  // ── 1. Hộp quà đáp xuống vườn ──────────────────────────────
  const handleBoxLanded = useCallback(() => {
    setPhase('box_idle');
  }, []);

  // ── 2. Người dùng nhấp vào hộp quà (1 → 4 lần) ─────────────
  const handleBoxClick = useCallback(
    (count: number) => {
      setBoxClickCount(count);
      if (!bgmPlaying && !isMuted) {
        audioEngine.startBgm();
        setBgmPlaying(true);
      }
    },
    [bgmPlaying, isMuted]
  );

  // ── 3. Nắp hộp mở xong → chuyển sang màn nhập tên ──────────
  const handleBoxOpened = useCallback(() => {
    setPhase('box_opening');
    setScreenFlash(true);
    window.setTimeout(() => {
      setScreenFlash(false);
      setPhase('name_input');
    }, 800);
  }, []);

  // ── 4. Chốt phần thưởng TRƯỚC khi quay roulette ────────────
  const handleRecipientConfirmed = useCallback((result: RecipientMatchResult) => {
    setRecipientResult(result);
    const { reward } = determineRecipientReward(result.profile);

    // Chọn lời chúc cho lượt này (ưu tiên bộ riêng của người nhận,
    // sau đó tới bậc độ hiếm, cuối cùng là bộ mặc định) và giữ nguyên
    // suốt lượt chơi. Việc này KHÔNG ảnh hưởng tới phần thưởng.
    setPlayContent(pickPlayContent(result, reward));

    setWonItem(reward);
    setPhase('roulette');
  }, []);

  // ── 5. Roulette dừng lại ───────────────────────────────────
  const handleRouletteFinished = useCallback(() => {
    setPhase((current) => {
      if (current !== 'roulette') return current;
      if (wonItem?.rarity === 'secret') return 'secret_reveal';
      return 'reward_stage';
    });
  }, [wonItem?.rarity]);

  // ── 6. Chuyển sang màn thiệp ───────────────────────────────
  // Thiệp xuất hiện ở dạng thu gọn (bìa hướng về người xem) đặt cạnh
  // nhân vật; người dùng bấm "Đọc thiệp" hoặc chạm vào thiệp để mở rộng
  // thành khung đọc thẳng góc, chữ to rõ.
  const handleProceedToLetter = useCallback(() => {
    setCardMode('compact');
    setCardPage('letter');
    setIsCardOpen(false);
    setPhase('letter_reading');
  }, []);

  // Nhấp vào tấm thiệp 3D: mở rộng để đọc ⇄ thu gọn về vị trí cạnh nhân vật.
  // Khi thu gọn thì gấp thiệp lại để bìa luôn nằm gọn trong khung hình.
  const handleCardClick = useCallback(() => {
    const next: CardMode = cardMode === 'compact' ? 'expanded' : 'compact';
    setCardMode(next);
    setIsCardOpen(next === 'expanded');
  }, [cardMode]);

  const handleRestart = useCallback(() => {
    setIsCardOpen(false);
    setCardMode('compact');
    setCardPage('letter');
    setPlayContent(EMPTY_PLAY_CONTENT);
    setWonItem(null);
    setRecipientResult(null);
    setCompanionImageUrl(null);
    setBoxClickCount(0);
    setSkipToken(0);
    setReplayToken(0);
    setPhase('box_idle');
    setRunId((n) => n + 1); // dựng lại scene để hộp quà rơi lại từ đầu
  }, []);

  // ── Audio ──────────────────────────────────────────────────
  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      audioEngine.setMuted(next);
      if (next) setBgmPlaying(false);
      return next;
    });
  }, []);

  const handleToggleBgm = useCallback(() => {
    setBgmPlaying(audioEngine.toggleBgm());
  }, []);

  // ── Dữ liệu thiệp ──────────────────────────────────────────
  // Tên hiển thị = HAI từ cuối của họ tên người dùng nhập; họ tên đầy đủ
  // (playContent.fullName) vẫn được giữ cho việc đối chiếu hồ sơ.
  const displayName = playContent.displayName || 'bạn';

  const cardData: CardTextData | null = useMemo(
    () =>
      buildCardData({
        result: recipientResult,
        reward: wonItem,
        content: playContent,
        companionImageUrl: companionImageUrl ?? undefined,
      }),
    [recipientResult, wonItem, playContent, companionImageUrl]
  );

  const handleExportCard = useCallback(async () => {
    if (!cardData) return;
    setIsExporting(true);
    audioEngine.playClick();
    await exportCardAsImage(cardData, `Thiep-20-10-${displayName}.png`);
    setIsExporting(false);
  }, [cardData, displayName]);

  const rarityConfig = wonItem ? RARITY_CONFIGS[wonItem.rarity] : null;

  return (
    <div className="relative w-screen h-full overflow-hidden bg-gradient-to-b from-[#FFF6FA] via-[#FCE9F1] to-[#EFE3F7] select-none font-sans">
      {/* 3D WORLD */}
      <SceneContainer
        key={runId}
        phase={phase}
        wonItem={wonItem}
        cardData={cardData}
        onLanded={handleBoxLanded}
        onBoxClick={handleBoxClick}
        onBoxOpened={handleBoxOpened}
        isCardOpen={isCardOpen}
        cardMode={cardMode}
        cardPage={cardPage}
        onToggleCard={handleCardClick}
        skipToken={skipToken}
        replayToken={replayToken}
        reducedMotion={reducedMotion}
        toolbarHeightPx={toolbarHeightPx}
      />

      {/* Chụp nhân vật thành ảnh 2D để in vào trang thư (chạy ẩn, tự gỡ sau khi chụp) */}
      {wonItem && !companionImageUrl && (
        <CharacterSnapshot
          characterType={wonItem.characterType}
          onCapture={setCompanionImageUrl}
        />
      )}

      {/* Chớp sáng chuyển cảnh */}
      {screenFlash && (
        <div className="fixed inset-0 z-50 bg-white/75 pointer-events-none animate-fade-in" />
      )}

      <AudioControls
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        bgmPlaying={bgmPlaying}
        onToggleBgm={handleToggleBgm}
      />

      {/* Gợi ý tương tác hộp quà */}
      <IntroOverlay phase={phase} clickCount={boxClickCount} />

      {/* Nhập họ tên */}
      {phase === 'name_input' && (
        <NameInputModal onRecipientConfirmed={handleRecipientConfirmed} />
      )}

      {/* Vòng quay phần thưởng */}
      {phase === 'roulette' && wonItem && (
        <CS2Roulette wonItem={wonItem} onFinished={handleRouletteFinished} />
      )}

      {/* Màn lộ diện Secret */}
      {phase === 'secret_reveal' && wonItem && (
        <SecretCutscene
          wonItem={wonItem}
          recipientName={displayName}
          onProceedToLetter={handleProceedToLetter}
        />
      )}

      {/* Sân khấu phần thưởng thường / hiếm / sử thi */}
      {phase === 'reward_stage' && wonItem && rarityConfig && (
        <div className="fixed inset-x-0 bottom-6 z-30 flex flex-col items-center pointer-events-auto px-4 animate-slide-up">
          <div className="p-4 max-w-md w-full rounded-3xl bg-white/85 backdrop-blur-xl border border-pink-200 shadow-xl shadow-pink-300/20 text-center">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white mb-1.5"
              style={{ backgroundColor: rarityConfig.badgeBg }}
            >
              {rarityConfig.vietnameseName}
            </div>
            <div className="text-[11px] font-semibold text-rose-700 mb-1">
              Dành riêng cho {displayName} 💝
            </div>
            <h3 className="text-lg font-bold text-gray-800 leading-snug">
              {wonItem.vietnameseName.replace(/\s*\(Secret\)\s*$/i, '')}
            </h3>
            <p className="text-xs text-gray-600 mt-1.5 mb-3 font-medium leading-relaxed">
              {getRewardIntro(wonItem.id, wonItem.rarity)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleProceedToLetter}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-xs sm:text-sm tracking-wider shadow-lg shadow-pink-400/30 transition-all active:scale-95 cursor-pointer"
              >
                MỞ THIỆP CHÚC MỪNG 💌
              </button>
              <button
                onClick={handleRestart}
                className="py-3 px-4 rounded-2xl bg-white/80 hover:bg-white text-gray-700 text-xs font-semibold transition-colors border border-pink-200 active:scale-95 cursor-pointer"
              >
                Quay Lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thanh công cụ của tấm thiệp 3D */}
      {phase === 'letter_reading' && cardData && (
        <GreetingCardOverlay
          displayName={displayName}
          companionName={cardData.companionName}
          rarityLabel={cardData.rarityLabel}
          isOpen={isCardOpen}
          isExpanded={cardMode === 'expanded'}
          isExporting={isExporting}
          page={cardPage}
          showPageToggle={isNarrowScreen}
          onTogglePage={() =>
            setCardPage((current) => (current === 'letter' ? 'portrait' : 'letter'))
          }
          onToggleOpen={() => setIsCardOpen((v) => !v)}
          onExpand={() => {
            setCardMode('expanded');
            setIsCardOpen(true);
          }}
          onCollapse={() => {
            // Thu gọn: gấp thiệp lại để bìa nằm gọn cạnh nhân vật
            setCardMode('compact');
            setIsCardOpen(false);
          }}
          onExport={handleExportCard}
          onReplay={() => {
            setCardMode('expanded');
            setIsCardOpen(true);
            setReplayToken((n) => n + 1);
          }}
          onSkip={() => {
            setCardMode('expanded');
            setIsCardOpen(true);
            setSkipToken((n) => n + 1);
          }}
          onRestart={handleRestart}
          onToolbarHeightChange={setToolbarHeightPx}
        />
      )}
    </div>
  );
};

export default App;
