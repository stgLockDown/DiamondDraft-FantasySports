import { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuthStore } from '../src/stores/authStore';
import { theme } from '../src/theme';

export default function Register() {
  const [form, setForm] = useState({ email: '', username: '', displayName: '', password: '' });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);

  const set = (k: keyof typeof form) => (v: string) => setForm({ ...form, [k]: v });

  const onSubmit = async () => {
    setErr(null);
    setLoading(true);
    try {
      await register(form);
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Sign-up failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <Text style={{ color: theme.colors.text, ...theme.typography.title, textAlign: 'center' }}>
          Create your account
        </Text>

        <TextInput value={form.email} onChangeText={set('email')}
          placeholder="Email" keyboardType="email-address" autoCapitalize="none"
          placeholderTextColor={theme.colors.textMuted} style={inputStyle} />
        <TextInput value={form.username} onChangeText={set('username')}
          placeholder="Username" autoCapitalize="none"
          placeholderTextColor={theme.colors.textMuted} style={inputStyle} />
        <TextInput value={form.displayName} onChangeText={set('displayName')}
          placeholder="Display name"
          placeholderTextColor={theme.colors.textMuted} style={inputStyle} />
        <TextInput value={form.password} onChangeText={set('password')}
          placeholder="Password (8+ chars)" secureTextEntry
          placeholderTextColor={theme.colors.textMuted} style={inputStyle} />

        {err && <Text style={{ color: theme.colors.danger, textAlign: 'center' }}>{err}</Text>}

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
            {loading ? 'Creating…' : 'Create account'}
          </Text>
        </Pressable>
      </ScrollView>
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