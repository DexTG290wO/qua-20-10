import React from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';

interface AudioControlsProps {
  isMuted: boolean;
  onToggleMute: () => void;
  bgmPlaying: boolean;
  onToggleBgm: () => void;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  isMuted,
  onToggleMute,
  bgmPlaying,
  onToggleBgm,
}) => {
  return (
    <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
      {/* Background Music Toggle */}
      <button
        onClick={onToggleBgm}
        title={bgmPlaying ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
        className={`px-3 py-2 rounded-2xl backdrop-blur-md border shadow-md flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
          bgmPlaying
            ? 'bg-pink-500/85 border-pink-300 text-white shadow-pink-500/30'
            : 'bg-white/80 border-pink-200 text-gray-700 hover:bg-white'
        }`}
      >
        <Music className={`w-3.5 h-3.5 ${bgmPlaying ? 'animate-bounce' : ''}`} />
        <span className="hidden sm:inline">{bgmPlaying ? 'Nhạc: Bật' : 'Nhạc: Tắt'}</span>
      </button>

      {/* SFX Mute Toggle */}
      <button
        onClick={onToggleMute}
        title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        className={`p-2.5 rounded-2xl backdrop-blur-md border shadow-md transition-all cursor-pointer ${
          isMuted
            ? 'bg-rose-50 border-rose-200 text-rose-500'
            : 'bg-white/80 border-pink-200 text-gray-700 hover:bg-white'
        }`}
      >
        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
      </button>
    </div>
  );
};
