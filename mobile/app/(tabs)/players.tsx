import { useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { playerAPI } from '../../src/services/api';
import { theme } from '../../src/theme';

export default function PlayersTab() {
  const router = useRouter();
  const [q, setQ] = useState('');

  const { data, isFetching } = useQuery({
    queryKey: ['players', q],
    queryFn: () =>
      playerAPI.search({ q, limit: 25 }).then((r) => r.data?.players || r.data || []),
    enabled: q.length >= 2,
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg, padding: theme.spacing.lg }}>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search players…"
        placeholderTextColor={theme.colors.textMuted}
        style={{
          backgroundColor: theme.colors.card,
          color: theme.colors.text,
          padding: theme.spacing.md,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          marginBottom: theme.spacing.lg,
        }}
      />

      {q.length < 2 ? (
        <Text style={{ color: theme.colors.textMuted }}>Type at least 2 characters to search.</Text>
      ) : isFetching ? (
        <Text style={{ color: theme.colors.textMuted }}>Searching…</Text>
      ) : (
        <FlatList
          data={data || []}
          keyExtractor={(it: any) => it.id || String(it.mlbId)}
          ListEmptyComponent={<Text style={{ color: theme.colors.textMuted }}>No matches.</Text>}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
          renderItem={({ item }: any) => (
            <Pressable
              onPress={() => item.mlbId && router.push(`/player/${item.mlbId}`)}
              style={({ pressed }) => [
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border,
                  borderWidth: 1,
                  padding: theme.spacing.md,
                  borderRadius: theme.radius.md,
                },
                pressed && { opacity: 0.7 },
              ]}>
              <Text style={{ color: theme.colors.text, ...theme.typography.h2 }}>
                {item.fullName || `${item.firstName} ${item.lastName}`}
              </Text>
              <Text style={{ color: theme.colors.textMuted, ...theme.typography.small }}>
                {item.position || '—'} · {item.team || item.teamFullName || ''} · {item.sport || 'MLB'}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}