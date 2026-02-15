"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
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
  const [breathDuration, setBreathDuration] = useState(4); // seconds per phase
  const [sessionMinutes, setSessionMinutes] = useState(5);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const lastPhaseRef = useRef<BreathPhase>("inhale");

  // Initialize audio context on first interaction
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
  }, []);

  const phaseOrder: BreathPhase[] = ["inhale", "holdIn", "exhale", "holdOut"];

  // Main timer effect
  useEffect(() => {
    if (!isRunning) return;

    const intervalMs = 50; // Update every 50ms for smooth animation
    const totalSessionMs = sessionMinutes * 60 * 1000;
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
          // Move to next phase
          setPhase((currentPhase) => {
            const currentIndex = phaseOrder.indexOf(currentPhase);
            const nextPhase = phaseOrder[(currentIndex + 1) % phaseOrder.length];

            // Play chime for new phase
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

  // Play initial chime when starting
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

  // Calculate circle scale based on phase and progress
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
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="max-w-md w-full space-y-4 sm:space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-light text-white mb-2">Resonant</h1>
          <p className="text-slate-400 text-sm">Breathe with intention</p>
        </div>

        {/* Breathing Circle */}
        <div className="flex items-center justify-center h-48 sm:h-64">
          <div
            className="rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 transition-transform duration-100 ease-out flex items-center justify-center"
            style={{
              width: "200px",
              height: "200px",
              transform: `scale(${getCircleScale()})`,
            }}
          >
            <span className="text-white text-xl font-light">
              {phaseLabels[phase]}
            </span>
          </div>
        </div>

        {/* Timer Display */}
        <div className="text-center">
          <p className="text-4xl font-light text-white tabular-nums">
            {formatTime(remainingSeconds)}
          </p>
          <p className="text-slate-400 text-sm mt-1">remaining</p>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {!isRunning ? (
            <Button
              onClick={handleStart}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Play className="mr-2 h-4 w-4" />
              Start
            </Button>
          ) : (
            <Button
              onClick={handlePause}
              size="lg"
              variant="secondary"
            >
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
          )}
          <Button onClick={handleReset} size="lg" variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>

        {/* Settings */}
        <Card className="p-4 sm:p-6 bg-slate-800/50 border-slate-700">
          <div className="space-y-4 sm:space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-slate-300">
                  Breath Duration
                </label>
                <span className="text-sm text-slate-400">
                  {breathDuration}s per phase
                </span>
              </div>
              <Slider
                value={[breathDuration]}
                onValueChange={(v) => setBreathDuration(v[0])}
                min={2}
                max={8}
                step={1}
                disabled={isRunning}
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-slate-300">
                  Session Length
                </label>
                <span className="text-sm text-slate-400">
                  {sessionMinutes} minutes
                </span>
              </div>
              <Slider
                value={[sessionMinutes]}
                onValueChange={(v) => setSessionMinutes(v[0])}
                min={1}
                max={20}
                step={1}
                disabled={isRunning}
              />
            </div>
          </div>
        </Card>

        {/* Info */}
        <p className="text-center text-slate-500 text-xs">
          Box breathing: {breathDuration}s inhale → {breathDuration}s hold →{" "}
          {breathDuration}s exhale → {breathDuration}s hold
        </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
