import React, { useEffect, useState } from 'react';
import type { ItemReward } from '../../types/reward';
import { Sparkles, Crown, ArrowRight } from 'lucide-react';
import { audioEngine } from '../../utils/audioEngine';

interface SecretCutsceneProps {
  wonItem: ItemReward;
  recipientName?: string;
  onProceedToLetter: () => void;
}

export const SecretCutscene: React.FC<SecretCutsceneProps> = ({
  wonItem,
  recipientName,
  onProceedToLetter,
}) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 600);
    const t2 = setTimeout(() => {
      setStage(2);
      audioEngine.playWinSecret();
    }, 1400);
    const t3 = setTimeout(() => setStage(3), 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-between p-6 bg-[#3A2733]/60 backdrop-blur-md pointer-events-auto select-none animate-fade-in">
      {/* 1. TOP CELESTIAL BANNER */}
      <div className={`transition-all duration-1000 ${stage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r from-amber-300/70 via-yellow-200/80 to-amber-300/70 border border-yellow-100/80 shadow-[0_0_30px_rgba(255,215,0,0.45)] backdrop-blur-md">
          <Crown className="w-6 h-6 text-amber-600 animate-bounce" />
          <span className="text-lg md:text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-amber-700 to-rose-600 drop-shadow">
            SECRET UNLOCKED
          </span>
          <Crown className="w-6 h-6 text-amber-600 animate-bounce" />
        </div>
      </div>

      {/* 2. CENTER STAGE AURA RAYS */}
      <div className="relative flex flex-col items-center justify-center my-auto pointer-events-none">
        {stage >= 1 && (
          <div className="absolute w-80 h-80 rounded-full border-2 border-amber-200/70 animate-spin-slow shadow-[0_0_80px_rgba(255,215,0,0.35)]" />
        )}
      </div>

      {/* 3. BOTTOM REWARD CARD & PROCEED BUTTON */}
      <div
        className={`w-full max-w-lg transition-all duration-1000 ${
          stage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
        <div className="p-6 rounded-3xl bg-gradient-to-b from-[#FFFBF0]/95 to-[#FFEFF5]/95 backdrop-blur-2xl border-2 border-amber-200 shadow-[0_0_40px_rgba(255,215,0,0.3)] text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{wonItem.title}</span>
          </div>

          <h3 className="text-xl md:text-2xl font-bold text-rose-700 tracking-tight mb-2">
            {wonItem.vietnameseName.replace(/\s*\(Secret\)\s*$/i, '')}
          </h3>

          {recipientName && (
            <p className="text-xs font-semibold text-rose-600 mb-2">
              Dành riêng cho {recipientName} 💝
            </p>
          )}

          <p className="text-xs md:text-sm text-rose-600/90 italic mb-4 font-serif">
            “{wonItem.catchphrase}”
          </p>

          <p className="text-xs text-gray-600 mb-5 leading-relaxed">
            {wonItem.description}
          </p>

          <button
            onClick={() => {
              audioEngine.playEnvelopeOpen();
              onProceedToLetter();
            }}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:from-amber-300 hover:to-yellow-200 text-slate-900 font-bold text-sm md:text-base tracking-wider shadow-lg shadow-amber-400/40 transform active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>MỞ THIỆP CHÚC MỪNG DÀNH RIÊNG CHO BẠN</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
