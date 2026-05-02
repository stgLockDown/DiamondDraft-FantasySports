import { View, Text, Pressable, Linking } from 'react-native';
import { useAuthStore } from '../../src/stores/authStore';
import { API_URL } from '../../src/services/api';
import { theme } from '../../src/theme';

export default function ProfileTab() {
  const { user, logout } = useAuthStore();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, padding: theme.spacing.xl, gap: theme.spacing.lg }}>
      <View>
        <Text style={{ color: theme.colors.textMuted, ...theme.typography.small }}>Signed in as</Text>
        <Text style={{ color: theme.colors.text, ...theme.typography.title, marginTop: 4 }}>
          {user?.displayName || 'Manager'}
        </Text>
        <Text style={{ color: theme.colors.textMuted, ...theme.typography.small }}>
          {user?.email}
        </Text>
        {user?.tier && (
          <View style={{
            marginTop: 12, alignSelf: 'flex-start',
            backgroundColor: theme.colors.accentMuted,
            paddingHorizontal: 12, paddingVertical: 6,
            borderRadius: theme.radius.pill,
          }}>
            <Text style={{ color: theme.colors.accent, fontWeight: '700' }}>
              {user.tier}
            </Text>
          </View>
        )}
      </View>

      <View style={{ gap: theme.spacing.md }}>
        <Pressable onPress={() => Linking.openURL(API_URL)} style={linkButton}>
          <Text style={{ color: theme.colors.text }}>Open full web app ›</Text>
        </Pressable>

        <Pressable onPress={logout} style={[linkButton, { borderColor: 'rgba(239,68,68,0.3)' }]}>
          <Text style={{ color: theme.colors.danger }}>Log out</Text>
        </Pressable>
      </View>

      <View style={{ marginTop: 'auto' }}>
        <Text style={{ color: theme.colors.textMuted, ...theme.typography.tiny }}>
          DiamondDraft Mobile · v1.0.0
        </Text>
      </View>
    </View>
  );
}

const linkButton = {
  backgroundColor: theme.colors.card,
  borderColor: theme.colors.border,
  borderWidth: 1,
  padding: theme.spacing.lg,
  borderRadius: theme.radius.md,
} as const;