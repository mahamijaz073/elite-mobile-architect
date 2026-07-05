---
name: Expo auth guard pattern
description: Reliable auth gating in expo-router using useSegments+useRouter+useEffect instead of <Redirect>.
---

## Rule
Use `useSegments` + `useRouter` + `useEffect` for auth-based navigation in expo-router. Do NOT return `<Redirect href="/auth" />` from the layout's render function without a wrapping Stack — it causes a blank white screen on web because expo-router has nowhere to render the target route.

## Why
`<Redirect>` outside a Stack context is processed before the router knows what screens are available, leading to a silent no-op render on web. The `useEffect` pattern fires after the component tree is mounted, when the router is fully initialized.

## How to apply

```tsx
function AuthGuard() {
  const { user, isLoading } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === 'auth';
    if (!user && !inAuthGroup) router.replace('/auth');
    else if (user && inAuthGroup) router.replace('/(tabs)');
  }, [user, isLoading, segments]);

  return null;
}

function RootLayoutNav() {
  return (
    <>
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
```

The Stack always renders. `AuthGuard` is a sibling null-renderer that handles navigation side-effects only.
