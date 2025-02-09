import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Settings2, Volume2, VolumeX, Play, Pause, Maximize2, RotateCcw, RotateCw, Loader2, MonitorPlay, Gauge, Clapperboard, Sliders } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
}

interface SettingsTab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [qualities, setQualities] = useState<{ height: number; level: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [buffered, setBuffered] = useState<{ start: number; end: number }[]>([]);
  const hlsRef = useRef<Hls | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const [activeSettingsTab, setActiveSettingsTab] = useState<string>('playback');
  const [videoFit, setVideoFit] = useState<'contain' | 'cover'>('contain');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [isMobile, setIsMobile] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // ... (keep all the existing useEffects and handlers)

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto rounded-xl overflow-hidden border-2 border-red-600/50 bg-black shadow-lg shadow-red-600/20 group touch-none"
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => !showSettings && setShowControls(false)}
      onTouchStart={() => setShowControls(true)}
    >
      {error && (
        <div className="absolute top-4 left-4 right-4 z-50 bg-red-900/90 text-white px-4 py-2 rounded-lg backdrop-blur-sm border border-red-500/20">
          {error}
        </div>
      )}
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-40">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
        </div>
      )}
      
      <video
        ref={videoRef}
        className="w-full h-full cursor-pointer"
        onClick={togglePlay}
        style={{
          objectFit: videoFit,
          filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
        }}
      />

      <div 
        className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="relative">
          {buffered.map((range, index) => (
            <div
              key={index}
              className="absolute h-1 bg-white/20 rounded"
              style={{
                left: `${(range.start / duration) * 100}%`,
                width: `${((range.end - range.start) / duration) * 100}%`,
                bottom: 0,
              }}
            />
          ))}
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-white/10 appearance-none cursor-pointer focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-500 hover:[&::-webkit-slider-thumb]:bg-red-400 [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-red-900"
            style={{
              background: `linear-gradient(to right, #dc2626 ${(currentTime / duration) * 100}%, rgba(255,255,255,0.1) ${(currentTime / duration) * 100}%)`,
            }}
          />
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2 p-2 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center space-x-2 md:space-x-4">
            <button
              onClick={togglePlay}
              disabled={isLoading}
              className="text-white hover:text-red-500 transition-colors disabled:opacity-50 p-1.5 hover:bg-red-500/10 rounded-lg"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>

            <div className="relative">
              <button 
                onClick={toggleMute}
                onMouseEnter={() => !isMobile && setShowVolumeSlider(true)}
                className="text-white hover:text-red-500 transition-colors p-1.5 hover:bg-red-500/10 rounded-lg"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              
              <div 
                className={`absolute bottom-full left-0 mb-2 bg-black/95 backdrop-blur-sm border border-red-900/20 rounded-lg p-2 shadow-lg shadow-red-900/20 transition-opacity duration-200 ${
                  showVolumeSlider ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24 h-1 bg-white/10 appearance-none cursor-pointer focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-500 hover:[&::-webkit-slider-thumb]:bg-red-400 [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-red-900"
                  style={{
                    background: `linear-gradient(to right, #dc2626 ${volume * 100}%, rgba(255,255,255,0.1) ${volume * 100}%)`,
                  }}
                />
              </div>
            </div>

            {!isMobile && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => seekRelative(-10)}
                  className="text-white hover:text-red-500 transition-colors p-1.5 hover:bg-red-500/10 rounded-lg"
                >
                  <RotateCcw size={20} />
                </button>
                <button
                  onClick={() => seekRelative(10)}
                  className="text-white hover:text-red-500 transition-colors p-1.5 hover:bg-red-500/10 rounded-lg"
                >
                  <RotateCw size={20} />
                </button>
              </div>
            )}

            <span className="text-white text-sm font-medium">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`text-white hover:text-red-500 transition-colors p-1.5 hover:bg-red-500/10 rounded-lg ${
                  showSettings ? 'text-red-500 bg-red-500/10' : ''
                }`}
              >
                <Settings2 size={20} />
              </button>
              
              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur-sm border border-red-900/20 rounded-lg p-3 min-w-[240px] shadow-lg shadow-red-900/20">
                  <div className="flex space-x-1 mb-4 border-b border-red-900/20 pb-3">
                    {settingsTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveSettingsTab(tab.id)}
                        className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-sm ${
                          activeSettingsTab === tab.id
                            ? 'text-red-500 bg-red-950/30 border border-red-500/30'
                            : 'text-white hover:bg-red-950/20 border border-transparent hover:border-red-500/20'
                        } transition-all duration-150`}
                      >
                        {tab.icon}
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                  {renderSettingsContent()}
                </div>
              )}
            </div>

            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-red-500 transition-colors p-1.5 hover:bg-red-500/10 rounded-lg"
            >
              <Maximize2 size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
