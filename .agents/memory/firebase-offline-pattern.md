---
name: Firebase offline-safe auth pattern
description: Pattern for Firebase Auth listener in AppContext that is safe against unmount races, network failures, and infinite loading on no internet.
---

## Rule
Use a `cancelled` boolean alongside `resolved` in the `onAuthStateChanged` useEffect. Every async callback (including the AsyncStorage restore promise) must check `cancelled` before calling any setState.

## Why
Without `cancelled`, the AsyncStorage.getItem().then() promise can resolve after the component unmounts and call setState on a dead component. `resolved` only prevents the timeout from double-firing — it does not protect async callbacks from post-unmount execution.

## How to apply
```typescript
useEffect(() => {
  let resolved = false;
  let cancelled = false;  // <-- required for async restore safety

  AsyncStorage.getItem(KEY).then(raw => {
    if (cancelled || !raw) return;  // guard here
    setUser(JSON.parse(raw));
  });

  const unsubscribe = onAuthStateChanged(auth, user => {
    if (cancelled) return;  // guard here
    resolved = true;
    // ... setState calls
  }, err => {
    if (cancelled) return;  // guard here
    resolved = true;
    // ...
  });

  const timeout = setTimeout(() => {
    if (!resolved && !cancelled) { resolved = true; /* setState */ }
  }, 8000);

  return () => {
    cancelled = true;  // set in cleanup
    unsubscribe();
    clearTimeout(timeout);
  };
}, []);
```

Timeout of 8000ms is the right balance — long enough for slow networks, short enough not to block cold launches on offline devices.
