# Resonant

A breathing timer with gentle chimes. Resonant breathing — slow paced breathing around 5-6 breaths per minute — is one of the most consistently effective interventions for heart rate variability and parasympathetic activation. This is the simplest possible front-end for the practice.

**[resonant.kaufman.io →](https://resonant.kaufman.io)**

## What it does

A breath circle that expands and contracts at your chosen pace. Soft chimes mark each transition. A session timer for the length of your sit. That's the whole thing.

Defaults to box breathing (equal inhale / hold / exhale / hold). Tune each phase between 2-8 seconds; resonant breathing typically lives around 4-6 second equal phases.

## Run it locally

```bash
npm install
npm run dev
```

## Stack

Next.js 16 · TypeScript · Tailwind CSS v4 · shadcn/ui · Web Audio API for the chimes (synthesized, not sampled — keeps the bundle small).

## License

MIT.
