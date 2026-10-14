import React from 'react';
import { Sparkles, MousePointerClick } from 'lucide-react';
import type { GamePhase } from '../../types/game';

interface IntroOverlayProps {
  phase: GamePhase;
  clickCount: number;
}

export const IntroOverlay: React.FC<IntroOverlayProps> = ({ phase, clickCount }) => {
  if (phase !== 'intro' && phase !== 'box_idle') return null;

  const getStepHint = () => {
    switch (clickCount) {
      case 0:
        return 'Chạm hoặc click vào hộp quà để bắt đầu ma thuật ✨ (0/4)';
      case 1:
        return 'Hộp quà rung rinh! Chạm tiếp nào... 🎀 (1/4)';
      case 2:
        return 'Chiếc nơ đang bung nở! Tiếp tục nhé... 🌟 (2/4)';
      case 3:
        return 'Ánh sáng ma thuật đang dâng trào! Một cú chạm nữa thôi... 💫 (3/4)';
      default:
        return 'Hộp quà đang mở ra! 🎁';
    }
  };

  return (
    <div className="absolute inset-x-0 bottom-12 flex flex-col items-center justify-center pointer-events-none z-10 px-4 text-center select-none">
      {/* Title Subtitle */}
      <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/70 backdrop-blur-md shadow-lg border border-pink-200/60 mb-3 animate-fade-in">
        <Sparkles className="w-5 h-5 text-pink-500 animate-pulse" />
        <span className="text-sm md:text-base font-medium tracking-wide text-gray-800">
          Một món quà đặc biệt đang chờ chủ nhân…
        </span>
      </div>

      {/* Interactive Click Progress Hint */}
      {phase === 'box_idle' && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-pink-500/85 backdrop-blur-md text-white text-xs md:text-sm font-semibold shadow-md border border-pink-300 animate-bounce">
          <MousePointerClick className="w-4 h-4" />
          <span>{getStepHint()}</span>
        </div>
      )}
    </div>
  );
};
