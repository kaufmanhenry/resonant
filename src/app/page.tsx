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

// ─── Audio ────────────────────────────────────────────────────────────────────

function playChime(audioContext: AudioContext, frequency: number = 523.25) {
  if (audioContext.state === "suspended") audioContext.resume();
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.frequency.value = frequency;
  osc.type = "sine";
  gain.gain.setValueAtTime(0.3, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
  osc.start(audioContext.currentTime);
  osc.stop(audioContext.currentTime + 0.5);
}

// C5 → E5 → G5 ascending chime on session complete
function playCompletionChime(audioContext: AudioContext) {
  if (audioContext.state === "suspended") audioContext.resume();
  const notes = [523.25, 659.25, 783.99];
  const now = audioContext.currentTime;
  notes.forEach((freq, i) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = now + i * 0.3;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.45, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
    osc.start(t);
    osc.stop(t + 1.4);
  });
}

const phaseFrequencies: Record<BreathPhase, number> = {
  inhale: 523.25,   // C5
  holdIn: 659.25,   // E5
  exhale: 392.0,    // G4
  holdOut: 329.63,  // E4
};

// ─── Patterns ─────────────────────────────────────────────────────────────────

type PatternId = "box" | "478" | "coherent";

interface BreathPattern {
  id: PatternId;
  name: string;
  tagline: string;
  // Zero means skip this phase
  phases: Record<BreathPhase, number>;
}

const PATTERNS: Record<PatternId, BreathPattern> = {
  box: {
    id: "box",
    name: "Box",
    tagline: "Focus & balance",
    phases: { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4 },
  },
  "478": {
    id: "478",
    name: "4-7-8",
    tagline: "Calm & sleep",
    phases: { inhale: 4, holdIn: 7, exhale: 8, holdOut: 0 },
  },
  coherent: {
    id: "coherent",
    name: "Coherent",
    tagline: "HRV & flow",
    phases: { inhale: 5, holdIn: 0, exhale: 5, holdOut: 0 },
  },
};

const ALL_PHASES: BreathPhase[] = ["inhale", "holdIn", "exhale", "holdOut"];

function getEffectiveDurations(
  pattern: BreathPattern,
  boxDuration: number
): Record<BreathPhase, number> {
  if (pattern.id === "box") {
    return { inhale: boxDuration, holdIn: boxDuration, exhale: boxDuration, holdOut: boxDuration };
  }
  return pattern.phases;
}

function getActivePhases(durations: Record<BreathPhase, number>): BreathPhase[] {
  return ALL_PHASES.filter((p) => durations[p] > 0);
}

function formatPatternLabel(durations: Record<BreathPhase, number>): string {
  const active = ALL_PHASES.filter((p) => durations[p] > 0);
  return active.map((p) => `${durations[p]}s ${phaseLabels[p].toLowerCase()}`).join(" → ");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [phase, setPhase] = useState<BreathPhase>("inhale");
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [selectedPatternId, setSelectedPatternId] = useState<PatternId>("box");
  const [breathDuration, setBreathDuration] = useState(4);
  const [sessionMinutes, setSessionMinutes] = useState(5);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const phaseDurationsRef = useRef<Record<BreathPhase, number>>(PATTERNS.box.phases);
  const activePhasesRef = useRef<BreathPhase[]>(ALL_PHASES);
  const currentPhaseRef = useRef<BreathPhase>("inhale");

  const selectedPattern = PATTERNS[selectedPatternId];

  // Keep refs in sync with settings
  useEffect(() => {
    const durations = getEffectiveDurations(selectedPattern, breathDuration);
    phaseDurationsRef.current = durations;
    activePhasesRef.current = getActivePhases(durations);
  }, [selectedPatternId, breathDuration]);

  // Keep currentPhaseRef in sync with phase state
  useEffect(() => {
    currentPhaseRef.current = phase;
  }, [phase]);

  // Reset phase when pattern changes (while not running)
  useEffect(() => {
    if (!isRunning) {
      setPhase("inhale");
      setPhaseProgress(0);
    }
  }, [selectedPatternId]);

  // ── Audio unlock ────────────────────────────────────────────────────────────
  const initAudio = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }
    setAudioUnlocked(true);
  }, []);

  useEffect(() => {
    const unlockAudio = async () => {
      if (audioUnlocked) return;
      try {
        if (!audioContextRef.current) audioContextRef.current = new AudioContext();
        if (audioContextRef.current.state === "suspended") {
          await audioContextRef.current.resume();
        }
        const buffer = audioContextRef.current.createBuffer(1, 1, 22050);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.start(0);
        setAudioUnlocked(true);
      } catch (e) {
        console.warn("Audio unlock failed:", e);
      }
    };
    const events = ["touchstart", "touchend", "click", "keydown"];
    events.forEach((e) => document.addEventListener(e, unlockAudio, { once: true }));
    return () => events.forEach((e) => document.removeEventListener(e, unlockAudio));
  }, [audioUnlocked]);

  // ── Main interval ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRunning) return;
    const intervalMs = 50;

    const interval = setInterval(() => {
      // Elapsed time / session end
      setElapsedSeconds((prev) => {
        const newElapsed = prev + intervalMs / 1000;
        if (newElapsed >= sessionMinutes * 60) {
          setIsRunning(false);
          setIsComplete(true);
          if (audioContextRef.current) playCompletionChime(audioContextRef.current);
          return prev; // keep for display on complete screen
        }
        return newElapsed;
      });

      // Phase progress
      setPhaseProgress((prev) => {
        const currentDuration = phaseDurationsRef.current[currentPhaseRef.current] * 1000;
        const newProgress = prev + intervalMs / currentDuration;
        if (newProgress >= 1) {
          setPhase((currentPhase) => {
            const activePhases = activePhasesRef.current;
            const currentIndex = activePhases.indexOf(currentPhase);
            const nextIndex = (currentIndex + 1) % activePhases.length;
            const nextPhase = activePhases[nextIndex];

            // Count a cycle each time we wrap back to the first phase
            if (nextIndex === 0) {
              setCyclesCompleted((c) => c + 1);
            }

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
  }, [isRunning, sessionMinutes]);

  // Play opening chime when session starts
  useEffect(() => {
    if (isRunning && audioContextRef.current) {
      playChime(audioContextRef.current, phaseFrequencies[phase]);
    }
  }, [isRunning]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleStart = async () => {
    await initAudio();
    setIsRunning(true);
  };

  const handlePause = () => setIsRunning(false);

  const handleReset = () => {
    setIsRunning(false);
    setIsComplete(false);
    setPhase("inhale");
    setPhaseProgress(0);
    setElapsedSeconds(0);
    setCyclesCompleted(0);
  };

  const handleRestart = () => {
    setIsComplete(false);
    setPhase("inhale");
    setPhaseProgress(0);
    setElapsedSeconds(0);
    setCyclesCompleted(0);
  };

  const handleSelectPattern = (id: PatternId) => {
    if (isRunning) return;
    setSelectedPatternId(id);
  };

  // ── Circle animation ──────────────────────────────────────────────────────────
  const getCircleScale = () => {
    const base = 0.5;
    const range = 0.5;
    switch (phase) {
      case "inhale":   return base + range * phaseProgress;
      case "holdIn":   return 1;
      case "exhale":   return 1 - range * phaseProgress;
      case "holdOut":  return base;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const remainingSeconds = sessionMinutes * 60 - elapsedSeconds;
  const effectiveDurations = getEffectiveDurations(selectedPattern, breathDuration);

  // ── Session Complete Screen ───────────────────────────────────────────────────
  if (isComplete) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <div className="w-full max-w-sm space-y-8 text-center">
            {/* Icon */}
            <div className="flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 shadow-lg shadow-blue-500/30 flex items-center justify-center text-4xl">
                🌿
              </div>
            </div>

            {/* Title */}
            <div>
              <h2 className="text-3xl font-light text-white tracking-wide">
                Session complete
              </h2>
              <p className="text-slate-400 text-sm mt-2">Nice work. Take a moment.</p>
            </div>

            {/* Stats */}
            <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-light text-white tabular-nums">
                    {sessionMinutes}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">minutes</p>
                </div>
                <div>
                  <p className="text-2xl font-light text-white tabular-nums">
                    {cyclesCompleted}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">cycles</p>
                </div>
                <div>
                  <p className="text-2xl font-light text-white">
                    {selectedPattern.name}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">pattern</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleRestart}
                className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium rounded-xl transition-colors touch-manipulation"
              >
                <Play className="h-5 w-5" />
                Go again
              </button>
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-transparent border border-slate-600 hover:border-slate-500 hover:bg-slate-800/50 active:bg-slate-700/50 text-slate-300 font-medium rounded-xl transition-colors touch-manipulation"
              >
                Done
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Main screen ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-900">
      <div className="flex-1 flex flex-col items-center px-5 py-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <div className="w-full max-w-sm flex flex-col flex-1">

          {/* Header - compact */}
          <header className="text-center py-2">
            <h1 className="text-2xl font-light text-white tracking-wide">Resonant</h1>
            <p className="text-slate-500 text-xs mt-0.5">Breathe with intention</p>
          </header>

          {/* Breathing Circle - centered in available space */}
          <div className="flex-1 flex items-center justify-center min-h-0">
            <div
              className="rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 shadow-xl shadow-blue-500/25 transition-transform duration-100 ease-out flex items-center justify-center"
              style={{ width: "160px", height: "160px", transform: `scale(${getCircleScale()})` }}
            >
              <span className="text-white text-base font-light tracking-wide">
                {phaseLabels[phase]}
              </span>
            </div>
          </div>

          {/* Timer - tighter */}
          <div className="text-center py-4">
            <p className="text-5xl font-extralight text-white tabular-nums tracking-tight">
              {formatTime(remainingSeconds)}
            </p>
            <p className="text-slate-500 text-xs mt-1">remaining</p>
          </div>

          {/* Controls - more compact */}
          <div className="flex justify-center gap-3 pb-5">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="flex items-center justify-center gap-2 px-7 py-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium rounded-xl transition-colors touch-manipulation"
              >
                <Play className="h-5 w-5" />
                Start
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex items-center justify-center gap-2 px-7 py-3.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-white font-medium rounded-xl transition-colors touch-manipulation"
              >
                <Pause className="h-5 w-5" />
                Pause
              </button>
            )}
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 px-5 py-3.5 bg-transparent border border-slate-700 hover:border-slate-600 hover:bg-slate-800/50 active:bg-slate-700/50 text-slate-400 font-medium rounded-xl transition-colors touch-manipulation"
            >
              <RotateCcw className="h-5 w-5" />
              Reset
            </button>
          </div>

          {/* Settings Card - compact */}
          <div className="bg-slate-800/50 border border-slate-700/40 rounded-2xl p-4 space-y-4">

            {/* Pattern Selector - Segmented Control Style */}
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-3">
                Pattern
              </label>
              <div className="flex bg-slate-700/40 rounded-xl p-1">
                {(Object.values(PATTERNS) as BreathPattern[]).map((pattern) => (
                  <button
                    key={pattern.id}
                    onClick={() => handleSelectPattern(pattern.id)}
                    disabled={isRunning}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium text-center transition-all touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedPatternId === pattern.id
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-slate-400 hover:text-slate-200 active:bg-slate-700/50"
                    }`}
                  >
                    {pattern.name}
                  </button>
                ))}
              </div>
              {/* Selected pattern tagline */}
              <p className="text-center text-slate-500 text-xs mt-2">
                {selectedPattern.tagline}
              </p>
            </div>

            {/* Breath Duration (box only) */}
            {selectedPatternId === "box" && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-medium text-slate-400">
                    Breath Duration
                  </label>
                  <span className="text-xs text-slate-500 tabular-nums">
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
                  className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-white
                    [&::-webkit-slider-thumb]:shadow-md
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:transition-transform
                    [&::-webkit-slider-thumb]:active:scale-110"
                />
              </div>
            )}

            {/* Session Length */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-medium text-slate-400">
                  Session Length
                </label>
                <span className="text-xs text-slate-500 tabular-nums">
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
                className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:shadow-md
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:transition-transform
                  [&::-webkit-slider-thumb]:active:scale-110"
              />
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}
