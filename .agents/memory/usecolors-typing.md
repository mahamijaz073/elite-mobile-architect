---
name: useColors dark-key typing
description: Fix TS2352 cast error in useColors when both light and dark keys exist on the colors object.
---

## Rule
When `constants/colors.ts` has both a `light` and `dark` key, explicitly type the `palette` variable as `typeof colors.light` instead of using `colors as Record<string, typeof colors.light>`.

## Why
The `Record<string, typeof colors.light>` cast fails with TS2352 because `colors` also has a `radius: number` key which is not assignable to `typeof colors.light`. TypeScript rejects the cast.

## How to apply

```ts
// WRONG (TS2352 when dark key exists):
const palette =
  scheme === 'dark' && 'dark' in colors
    ? (colors as Record<string, typeof colors.light>).dark
    : colors.light;

// CORRECT:
const palette: typeof colors.light =
  scheme === 'dark' && colors.dark ? colors.dark : colors.light;
return { ...palette, radius: colors.radius };
```

Relies on TypeScript narrowing `colors.dark` directly (it's a known key) rather than an unsafe cast.
