---
name: Spin wheel ad-gating
description: How to gate extra spins behind an ad without causing an infinite ad-prompt loop.
---

## Rule
Track a `adGrantedSpin: boolean` state. Set it `true` after ad completion. Clear it immediately when the spin completes. Derive `requiresAd = freeSpinsLeft === 0 && !adGrantedSpin` and `canSpin = freeSpinsLeft > 0 || adGrantedSpin`.

## Why
If `requiresAd` is derived solely from `freeSpinsLeft === 0`, it stays true after the ad completes (freeSpinsLeft is still 0). SpinWheel calls `onAdRequired()` again immediately → infinite ad loop. The `adGrantedSpin` flag breaks this by temporarily satisfying the spin gate without modifying the spin count.

## How to apply

```tsx
const [adGrantedSpin, setAdGrantedSpin] = useState(false);
const freeSpinsLeft = Math.max(0, maxFreeSpins - dailySpinsUsed);
const requiresAd = freeSpinsLeft === 0 && !adGrantedSpin;
const canSpin = freeSpinsLeft > 0 || adGrantedSpin;

const handleAdComplete = () => {
  setShowAdModal(false);
  setAdGrantedSpin(true);  // grant exactly one spin
};

const handleSpinComplete = async (tokens, label) => {
  if (adGrantedSpin) setAdGrantedSpin(false);  // consume it
  await recordSpin();
  // ... rest of spin logic
};
```
