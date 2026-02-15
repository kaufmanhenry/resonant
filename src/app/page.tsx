"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Footer } from "@/components/Footer";

type BreathPhase = "inhale" | "holdIn" | "exhale" | "holdOut";

const phaseLabels: Record<BreathPhase, string> = {
  inhale: "Breathe In",
  holdIn: "Hold",
  exhale: "Breathe Out",
  holdOut: "Hold",
};

// Generate a chime sound using Web Audio API
function playChime(audioContext: AudioContext, frequency: number = 523.25) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + 0.5
  );

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

// Different frequencies for different phases
const phaseFrequencies: Record<BreathPhase, number> = {
  inhale: 523.25, // C5
  holdIn: 659.25, // E5
  exhale: 392.0, // G4
  holdOut: 329.63, // E4
};

export default function Home() {
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<BreathPhase>("inhale");
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [breathDuration, setBreathDuration] = useState(4);
  const [sessionMinutes, setSessionMinutes] = useState(5);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
  }, []);

  const phaseOrder: BreathPhase[] = ["inhale", "holdIn", "exhale", "holdOut"];

  useEffect(() => {
    if (!isRunning) return;

    const intervalMs = 50;
    const phaseDurationMs = breathDuration * 1000;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        const newElapsed = prev + intervalMs / 1000;
        if (newElapsed >= sessionMinutes * 60) {
          setIsRunning(false);
          return 0;
        }
        return newElapsed;
      });

      setPhaseProgress((prev) => {
        const newProgress = prev + intervalMs / phaseDurationMs;
        if (newProgress >= 1) {
          setPhase((currentPhase) => {
            const currentIndex = phaseOrder.indexOf(currentPhase);
            const nextPhase = phaseOrder[(currentIndex + 1) % phaseOrder.length];

            if (audioContextRef.current) {
              playChime(audioContextRef.current, phaseFrequencies[nextPhase]);
            }

            return nextPhase;
          });
          return 0;
        }
        return newProgress;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isRunning, breathDuration, sessionMinutes]);

  useEffect(() => {
    if (isRunning && audioContextRef.current) {
      playChime(audioContextRef.current, phaseFrequencies[phase]);
    }
  }, [isRunning]);

  const handleStart = () => {
    initAudio();
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setPhase("inhale");
    setPhaseProgress(0);
    setElapsedSeconds(0);
  };

  const getCircleScale = () => {
    const baseScale = 0.5;
    const maxScale = 1;
    const scaleRange = maxScale - baseScale;

    switch (phase) {
      case "inhale":
        return baseScale + scaleRange * phaseProgress;
      case "holdIn":
        return maxScale;
      case "exhale":
        return maxScale - scaleRange * phaseProgress;
      case "holdOut":
        return baseScale;
      default:
        return baseScale;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const remainingSeconds = sessionMinutes * 60 - elapsedSeconds;

  return (
    <div className="min-h-[100dvh] flex flex-col">
      {/* Main content - vertically centered, with safe area for Dynamic Island */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 pt-[max(2rem,env(safe-area-inset-top))]">
        <div className="w-full max-w-sm space-y-8">
          
          {/* Header */}
          <header className="text-center">
            <h1 className="text-3xl font-light text-white tracking-wide">Resonant</h1>
            <p className="text-slate-400 text-sm mt-1">Breathe with intention</p>
          </header>

          {/* Breathing Circle */}
          <div className="flex items-center justify-center py-4">
            <div
              className="rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 shadow-lg shadow-blue-500/20 transition-transform duration-100 ease-out flex items-center justify-center"
              style={{
                width: "180px",
                height: "180px",
                transform: `scale(${getCircleScale()})`,
              }}
            >
              <span className="text-white text-lg font-light tracking-wide">
                {phaseLabels[phase]}
              </span>
            </div>
          </div>

          {/* Timer Display */}
          <div className="text-center">
            <p className="text-5xl font-light text-white tabular-nums tracking-tight">
              {formatTime(remainingSeconds)}
            </p>
            <p className="text-slate-500 text-sm mt-2">remaining</p>
          </div>

          {/* Controls - large touch targets for mobile */}
          <div className="flex justify-center gap-3">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium rounded-xl transition-colors touch-manipulation"
              >
                <Play className="h-5 w-5" />
                Start
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-white font-medium rounded-xl transition-colors touch-manipulation"
              >
                <Pause className="h-5 w-5" />
                Pause
              </button>
            )}
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-transparent border border-slate-600 hover:border-slate-500 hover:bg-slate-800/50 active:bg-slate-700/50 text-slate-300 font-medium rounded-xl transition-colors touch-manipulation"
            >
              <RotateCcw className="h-5 w-5" />
              Reset
            </button>
          </div>

          {/* Settings Card */}
          <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 space-y-5">
            {/* Breath Duration */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-slate-300">
                  Breath Duration
                </label>
                <span className="text-sm text-slate-400 tabular-nums">
                  {breathDuration}s per phase
                </span>
              </div>
              <input
                type="range"
                value={breathDuration}
                onChange={(e) => setBreathDuration(Number(e.target.value))}
                min={2}
                max={8}
                step={1}
                disabled={isRunning}
                className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:shadow-md
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:transition-transform
                  [&::-webkit-slider-thumb]:active:scale-110"
              />
            </div>

            {/* Session Length */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-slate-300">
                  Session Length
                </label>
                <span className="text-sm text-slate-400 tabular-nums">
                  {sessionMinutes} min
                </span>
              </div>
              <input
                type="range"
                value={sessionMinutes}
                onChange={(e) => setSessionMinutes(Number(e.target.value))}
                min={1}
                max={20}
                step={1}
                disabled={isRunning}
                className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:shadow-md
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:transition-transform
                  [&::-webkit-slider-thumb]:active:scale-110"
              />
            </div>
          </div>

          {/* Info text */}
          <p className="text-center text-slate-500 text-xs leading-relaxed">
            Box breathing: {breathDuration}s inhale → {breathDuration}s hold →{" "}
            {breathDuration}s exhale → {breathDuration}s hold
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
