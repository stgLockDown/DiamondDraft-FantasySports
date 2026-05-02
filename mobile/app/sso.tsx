import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ssoAPI } from '../src/services/api';
import { useAuthStore } from '../src/stores/authStore';
import { theme } from '../src/theme';

/**
 * Deep-link landing: diamonddraft://sso?token=... or the HTTPS equivalent.
 * Exchanges the handoff token from ValorOdds for a DiamondDraft JWT and
 * drops the user into the tab bar.
 */
export default function SsoHandoff() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [err, setErr] = useState<string | null>(null);
  const setSession = useAuthStore((s) => s.setSession);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      if (!token) {
        setErr('Missing token.');
        return;
      }
      try {
        const { data } = await ssoAPI.valorOdds(token);
        await setSession(data.user, data.token, data.refreshToken);
        router.replace('/(tabs)');
      } catch (e: any) {
        setErr(e?.response?.data?.error || e?.message || 'Sign-in failed.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <View style={{
      flex: 1, backgroundColor: theme.colors.bg,
      alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl,
    }}>
      {err ? (
        <>
          <Text style={{ color: theme.colors.danger, ...theme.typography.h1, marginBottom: 8 }}>
            Sign-in failed
          </Text>
          <Text style={{ color: theme.colors.textMuted, textAlign: 'center' }}>{err}</Text>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={{ color: theme.colors.textMuted, marginTop: theme.spacing.lg }}>
            Signing you in from ValorOdds…
          </Text>
        </>
      )}
    </View>
  );
}