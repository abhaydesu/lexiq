import { useState, useRef, useEffect } from 'react';
import { Headphones, Play, Pause, Volume2, VolumeX, Music, CloudRain, Flame, Coffee } from 'lucide-react';
import { getShell } from '../../lib/theme';
import type { ReaderTheme } from '../../lib/theme';

interface AmbientAudioProps {
  theme: ReaderTheme;
  onOpenChange?: (isOpen: boolean) => void;
}

interface Track {
  id: string;
  name: string;
  icon: React.ElementType;
  url: string;
}

const TRACKS: Track[] = [
  {
    id: 'rain',
    name: 'Gentle Rain',
    icon: CloudRain,
    url: 'https://cdn.jsdelivr.net/gh/rafael-zaluar/pomodoro-app@master/public/sounds/rain.mp3',
  },
  {
    id: 'fireplace',
    name: 'Cozy Fireplace',
    icon: Flame,
    url: 'https://cdn.jsdelivr.net/gh/rafael-zaluar/pomodoro-app@master/public/sounds/fireplace.mp3',
  },
  {
    id: 'cafe',
    name: 'Bustling Cafe',
    icon: Coffee,
    url: 'https://cdn.jsdelivr.net/gh/rafael-zaluar/pomodoro-app@master/public/sounds/coffee-shop.mp3',
  },
  {
    id: 'lofi',
    name: 'Ambient Chill',
    icon: Music,
    url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3', // Kept this as it works
  }
];

export function AmbientAudio({ theme, onOpenChange }: AmbientAudioProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [activeTrack, setActiveTrack] = useState<Track>(TRACKS[0]);
  
  const shell = getShell(theme);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onOpenChange?.(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onOpenChange]);

  // Sync volume state to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle track changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.error("Audio playback failed:", e);
          setIsPlaying(false);
        });
      }
    }
  }, [activeTrack]);

  // Handle play/pause state
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        if (audioRef.current.paused) {
          audioRef.current.play().catch(e => {
            console.error("Audio playback failed:", e);
            setIsPlaying(false);
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const toggleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);
    onOpenChange?.(next);
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={toggleOpen}
        style={{ color: isPlaying ? shell.accent : shell.text }}
        className="reader-ctrl-btn btn-press p-2 relative"
        title="Ambient Music"
      >
        <Headphones size={18} />
        {isPlaying && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-ink-accent rounded-full shadow-[0_0_8px_rgba(217,119,6,0.8)] animate-pulse" />
        )}
      </button>

      {/* Hidden audio element */}
      <audio 
        ref={audioRef} 
        src={activeTrack.url} 
        loop 
        preload="auto"
      />

      {isOpen && (
        <div 
          className="absolute top-full mt-2 right-0 w-64 rounded-2xl border shadow-2xl p-4 animate-fade-in z-[250]"
          style={{ 
            backgroundColor: shell.surface, 
            borderColor: shell.border,
            color: shell.text
          }}
        >
          <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: shell.border }}>
            <div className="flex items-center gap-2">
              <Headphones size={16} style={{ color: shell.accent }} />
              <h3 className="font-medium text-sm">Ambient Audio</h3>
            </div>
            
            <button 
              onClick={togglePlay}
              className="p-2 rounded-full hover:opacity-80 transition-opacity"
              style={{ backgroundColor: isPlaying ? shell.accent : shell.border, color: isPlaying ? '#fff' : shell.text }}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
            </button>
          </div>

          <div className="space-y-4">
            {/* Track Selector */}
            <div className="grid grid-cols-2 gap-2">
              {TRACKS.map(track => {
                const Icon = track.icon;
                const isActive = activeTrack.id === track.id;
                return (
                  <button
                    key={track.id}
                    onClick={() => {
                      setActiveTrack(track);
                      if (!isPlaying) setIsPlaying(true);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-colors ${
                      isActive ? 'border-transparent' : 'hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                    style={{ 
                      borderColor: isActive ? 'transparent' : shell.border,
                      backgroundColor: isActive ? `${shell.accent}20` : 'transparent',
                      color: isActive ? shell.accent : shell.muted
                    }}
                  >
                    <Icon size={18} className="mb-1.5" />
                    <span className="text-[10px] font-medium leading-tight text-center">{track.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-3 pt-2">
              <button 
                onClick={() => setVolume(v => v === 0 ? 0.5 : 0)}
                style={{ color: shell.muted }}
              >
                {volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1 h-1 rounded-full appearance-none bg-black/10 dark:bg-white/10"
                style={{ accentColor: shell.accent }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
