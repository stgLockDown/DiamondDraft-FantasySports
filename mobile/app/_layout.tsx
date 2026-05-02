import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useAuthStore } from '../src/stores/authStore';
import { theme } from '../src/theme';
import * as Linking from 'expo-linking';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, hydrate } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  // Hydrate once on mount
  useEffect(() => { hydrate(); /* eslint-disable-next-line */ }, []);

  // Route-gate: unauthenticated users land on /login; authenticated users
  // get bounced out of /login onto the tab layout.
  useEffect(() => {
    if (isLoading) return;
    const inAuthArea = segments[0] === 'login' || segments[0] === 'register' || segments[0] === 'sso';
    if (!isAuthenticated && !inAuthArea) router.replace('/login');
    if (isAuthenticated && inAuthArea) router.replace('/(tabs)');
  }, [isAuthenticated, isLoading, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  // Deep-link handler: diamonddraft://sso?token=... or https://diamonddraft.app/sso?token=...
  // This lets the ValorOdds dashboard hand a user directly into the mobile app.
  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      const parsed = Linking.parse(url);
      if (parsed.path === 'sso' || parsed.hostname === 'sso') {
        const token = (parsed.queryParams as any)?.token as string | undefined;
        if (token) {
          // Dispatch to the /sso screen via router
          // Lazy import to avoid circular deps
          import('expo-router').then(({ router }) => {
            router.push({ pathname: '/sso', params: { token } });
          });
        }
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <AuthGate>
          <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
            <Stack screenOptions={{
              headerStyle: { backgroundColor: theme.colors.bg },
              headerTintColor: theme.colors.text,
              contentStyle: { backgroundColor: theme.colors.bg },
            }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ title: 'Sign In' }} />
              <Stack.Screen name="register" options={{ title: 'Create Account' }} />
              <Stack.Screen name="sso" options={{ title: 'Signing in…', headerShown: false }} />
              <Stack.Screen name="league/[id]" options={{ title: 'League' }} />
              <Stack.Screen name="player/[mlbId]" options={{ title: 'Player' }} />
            </Stack>
          </View>
        </AuthGate>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}