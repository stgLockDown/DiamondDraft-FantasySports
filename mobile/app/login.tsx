import { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { theme } from '../src/theme';

export default function Login() {
  const [loginField, setLoginField] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const onSubmit = async () => {
    setErr(null);
    setLoading(true);
    try {
      await login(loginField, password);
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, justifyContent: 'center', padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <Text style={{ color: theme.colors.text, ...theme.typography.title, textAlign: 'center' }}>
          ⚾ DiamondDraft
        </Text>
        <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginBottom: theme.spacing.lg }}>
          Sign in to manage your leagues
        </Text>

        <TextInput
          value={loginField}
          onChangeText={setLoginField}
          placeholder="Email or username"
          placeholderTextColor={theme.colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={inputStyle}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry
          style={inputStyle}
        />

        {err && (
          <Text style={{ color: theme.colors.danger, textAlign: 'center' }}>{err}</Text>
        )}

        <Pressable
          onPress={onSubmit}
          disabled={loading}
          style={({ pressed }) => [
            {
              backgroundColor: theme.colors.accent,
              padding: theme.spacing.lg,
              borderRadius: theme.radius.md,
              alignItems: 'center',
            },
            pressed && { opacity: 0.8 },
            loading && { opacity: 0.5 },
          ]}>
          <Text style={{ color: theme.colors.bg, fontWeight: '700' }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.push('/register')}>
          <Text style={{ color: theme.colors.textMuted, textAlign: 'center' }}>
            No account? <Text style={{ color: theme.colors.accent }}>Create one</Text>
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const inputStyle = {
  backgroundColor: theme.colors.card,
  color: theme.colors.text,
  padding: theme.spacing.lg,
  borderRadius: theme.radius.md,
  borderWidth: 1,
  borderColor: theme.colors.border,
  fontSize: 16,
} as const;