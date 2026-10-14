import React, { useState } from 'react';
import { Heart, AlertCircle, Sparkles } from 'lucide-react';
import type { RecipientMatchResult } from '../../types/recipient';
import { RECIPIENTS } from '../../config/recipients';
import { DEFAULT_LETTER } from '../../config/messages';
import { matchRecipient, normalizeName } from '../../utils/nameMatcher';
import { audioEngine } from '../../utils/audioEngine';

interface NameInputModalProps {
  onRecipientConfirmed: (result: RecipientMatchResult) => void;
}

/**
 * Ô nhập họ tên tối giản.
 * Chỉ có MỘT ô nhập duy nhất: không gợi ý tên, không autocomplete,
 * không hiển thị danh sách người nhận đã cấu hình.
 */
export const NameInputModal: React.FC<NameInputModalProps> = ({ onRecipientConfirmed }) => {
  const [inputName, setInputName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleaned = normalizeName(inputName);

    if (cleaned.length < 2) {
      setErrorMsg(
        cleaned.length === 0
          ? 'Bạn ơi, hãy nhập họ và tên của mình để món quà mở ra nhé! 💕'
          : 'Tên có vẻ hơi ngắn, bạn thử ghi đầy đủ họ và tên nhé! 💕'
      );
      audioEngine.playBoxShake();
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    audioEngine.playBoxOpen();

    // Đối chiếu ngầm với hồ sơ đã cấu hình; nếu không khớp thì dùng gói mặc định.
    const matched = matchRecipient(cleaned, RECIPIENTS);
    const result: RecipientMatchResult = matched
      ? { ...matched, effectiveDisplayName: cleaned }
      : {
          profile: {
            id: 'guest',
            officialName: cleaned,
            aliases: [cleaned],
            displayName: cleaned,
            odds: undefined, // dùng cấu hình mặc định trong config/rarity.ts
            letter: {
              greeting: DEFAULT_LETTER.greeting.replace(/\{\{displayName\}\}/g, cleaned),
              body: DEFAULT_LETTER.body.replace(/\{\{displayName\}\}/g, cleaned),
              signature: DEFAULT_LETTER.signature,
              postscript: DEFAULT_LETTER.postscript,
            },
          },
          matchedAlias: cleaned,
          normalizedInput: cleaned,
          effectiveDisplayName: cleaned,
        };

    // Giữ đúng tên người dùng nhập, trừ khi hồ sơ có yêu cầu riêng
    if (result.profile.customGreetingPrefix) {
      result.effectiveDisplayName = result.profile.displayName || cleaned;
    }

    window.setTimeout(() => onRecipientConfirmed(result), 220);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-pink-200 shadow-2xl shadow-pink-300/30 text-center animate-scale-up">
        <div className="inline-flex items-center justify-center w-14 h-14 -mt-12 mb-3 rounded-2xl bg-gradient-to-tr from-pink-400 via-rose-400 to-amber-300 text-white shadow-lg shadow-pink-300/40">
          <Heart className="w-7 h-7 fill-white animate-pulse" />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight mb-1 font-serif">
          Món quà này dành cho ai nhỉ?
        </h2>
        <p className="text-xs sm:text-sm text-pink-600/90 mb-6 font-medium">
          Nhập tên của bạn để mở khóa món quà 20/10 ✨
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div className="text-left">
            <label
              htmlFor="gift-full-name"
              className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider pl-1"
            >
              Họ và tên
            </label>
            <input
              id="gift-full-name"
              name="gift-full-name"
              type="text"
              value={inputName}
              onChange={(e) => {
                setInputName(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Nhập họ và tên của bạn…"
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="words"
              spellCheck={false}
              className="w-full px-5 py-3.5 text-base rounded-2xl bg-pink-50/70 border border-pink-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-pink-300/30 focus:border-pink-400 transition-all text-center font-medium shadow-inner"
            />
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-left rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 hover:from-pink-600 hover:via-rose-600 hover:to-pink-600 text-white font-bold text-sm sm:text-base tracking-wider shadow-lg shadow-pink-400/30 transform active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            <Sparkles className="w-4 h-4" />
            <span>Khám phá món quà</span>
          </button>
        </form>
      </div>
    </div>
  );
};
