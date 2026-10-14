import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ItemReward } from '../../types/reward';
import { RARITY_CONFIGS } from '../../config/rarity';
import { REWARDS } from '../../config/rewards';
import { audioEngine } from '../../utils/audioEngine';
import { Sparkles } from 'lucide-react';

interface CS2RouletteProps {
  wonItem: ItemReward;
  onFinished: () => void;
}

const CARD_WIDTH = 144;
const CARD_GAP = 12;
const CARD_PITCH = CARD_WIDTH + CARD_GAP;
const REEL_PAD = 16;
const WIN_INDEX = 48;
const TOTAL_CARDS = 60;

export const CS2Roulette: React.FC<CS2RouletteProps> = ({ wonItem, onFinished }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const reelRef = useRef<HTMLDivElement>(null);
  const [hasLanded, setHasLanded] = useState(false);
  const [screenFlash, setScreenFlash] = useState(false);

  // Giữ callback trong ref để vòng quay không bao giờ chạy lại chỉ vì
  // component cha render lại (tránh hiệu ứng trùng lặp).
  const onFinishedRef = useRef(onFinished);
  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  // Phần thưởng đã CHỐT trước khi quay — luôn nằm đúng ở WIN_INDEX.
  const cards = useMemo(() => {
    const list: ItemReward[] = [];
    for (let i = 0; i < TOTAL_CARDS; i++) {
      if (i === WIN_INDEX) {
        list.push(wonItem);
      } else {
        // Tránh vô tình lặp lại phần thưởng đã chốt ở các ô khác
        let rand = REWARDS[Math.floor(Math.random() * REWARDS.length)];
        if (rand.id === wonItem.id && REWARDS.length > 1) {
          rand = REWARDS[(REWARDS.indexOf(rand) + 1) % REWARDS.length];
        }
        list.push(rand);
      }
    }
    return list;
  }, [wonItem]);

  useEffect(() => {
    let animId = 0;
    let timeoutId = 0;
    let startTime: number | null = null;
    let cancelled = false;
    const duration = 5200;

    const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
    const centerOffset = containerWidth / 2 - CARD_WIDTH / 2;
    // căn chính xác ô WIN_INDEX vào vạch giữa (sai số nhỏ cho tự nhiên)
    const jitter = (Math.random() - 0.5) * 26;
    const targetX = REEL_PAD + WIN_INDEX * CARD_PITCH - centerOffset + jitter;

    let lastCardPassed = -1;

    const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3.8);

    const animate = (timestamp: number) => {
      if (cancelled) return;
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = easeOutCubic(progress);
      const currentX = targetX * ease;

      if (reelRef.current) {
        reelRef.current.style.transform = `translate3d(-${currentX}px, 0, 0)`;
      }

      const currentPassedCard = Math.floor((currentX + centerOffset - REEL_PAD) / CARD_PITCH);
      if (currentPassedCard !== lastCardPassed && currentPassedCard >= 0) {
        lastCardPassed = currentPassedCard;
        audioEngine.playRouletteTick(1 - progress * 0.7);
      }

      if (progress < 1) {
        animId = requestAnimationFrame(animate);
      } else {
        setHasLanded(true);
        setScreenFlash(true);
        audioEngine.playRouletteStop();

        if (wonItem.rarity === 'secret') audioEngine.playWinSecret();
        else if (wonItem.rarity === 'epic') audioEngine.playWinEpic();
        else if (wonItem.rarity === 'rare') audioEngine.playWinRare();
        else audioEngine.playWinNormal();

        timeoutId = window.setTimeout(() => setScreenFlash(false), 300);
        timeoutId = window.setTimeout(() => onFinishedRef.current(), 1500);
      }
    };

    timeoutId = window.setTimeout(() => {
      animId = requestAnimationFrame(animate);
    }, 380);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      cancelAnimationFrame(animId);
    };
  }, [wonItem, cards]);

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#3A2733]/70 backdrop-blur-md animate-fade-in select-none px-3">
      {screenFlash && (
        <div className="absolute inset-0 bg-white/70 z-50 pointer-events-none animate-fade-in" />
      )}

      <div className="mb-5 text-center">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white shadow-lg mb-2">
          <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
          <span className="text-sm md:text-base font-semibold tracking-wider uppercase">
            Hộp quà đang quay thưởng…
          </span>
        </div>
        <p className="text-xs md:text-sm text-pink-100/85">
          Điều bất ngờ dành cho bạn đang dần hé lộ!
        </p>
      </div>

      <div
        ref={containerRef}
        className="relative w-full max-w-4xl h-56 rounded-3xl border-2 border-pink-200/50 shadow-2xl overflow-hidden flex items-center bg-gradient-to-b from-[#4A3542] to-[#33232E]"
      >
        <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-[#3E2C39] via-[#3E2C39]/70 to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-[#3E2C39] via-[#3E2C39]/70 to-transparent z-20 pointer-events-none" />

        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-amber-300 shadow-[0_0_18px_#FFD700] z-30 pointer-events-none flex flex-col justify-between items-center">
          <div className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[15px] border-t-amber-300 drop-shadow-[0_2px_6px_#FFD700]" />
          <div className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-b-[15px] border-b-amber-300 drop-shadow-[0_-2px_6px_#FFD700]" />
        </div>

        <div
          ref={reelRef}
          className="flex items-center gap-3 will-change-transform"
          style={{ width: `${TOTAL_CARDS * CARD_PITCH + REEL_PAD * 2}px`, paddingLeft: `${REEL_PAD}px` }}
        >
          {cards.map((item, idx) => {
            const rarity = RARITY_CONFIGS[item.rarity];
            const isWinner = hasLanded && idx === WIN_INDEX;

            return (
              <div
                key={idx}
                style={{
                  width: `${CARD_WIDTH}px`,
                  borderColor: rarity.borderColor,
                  boxShadow: isWinner
                    ? `0 0 28px ${rarity.glowColor}`
                    : '0 4px 12px rgba(0,0,0,0.28)',
                  background: isWinner ? rarity.bgGradient : undefined,
                }}
                className={`relative h-44 rounded-2xl flex flex-col items-center justify-between p-3 border-2 transition-all duration-300 shrink-0 ${
                  isWinner ? 'scale-105 ring-4 ring-amber-200' : 'bg-white/8'
                }`}
              >
                <div
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-sm"
                  style={{ backgroundColor: rarity.badgeBg }}
                >
                  {rarity.vietnameseName}
                </div>

                <div className="text-4xl my-1 animate-bounce-subtle">{item.sparkleEmoji}</div>

                <div className="w-full text-center">
                  <div className="text-xs font-bold text-white truncate">
                    {item.vietnameseName.replace(/\s*\(Secret\)\s*$/i, '')}
                  </div>
                  <div className="text-[10px] text-pink-100/70 truncate">{item.name}</div>
                </div>

                <div
                  className="absolute bottom-0 inset-x-0 h-1.5 rounded-b-2xl"
                  style={{ backgroundColor: rarity.color }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
