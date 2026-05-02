import { FlatList, View, Text, RefreshControl, Pressable } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { leagueAPI } from '../../src/services/api';
import { theme } from '../../src/theme';

export default function LeaguesTab() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['leagues'],
    queryFn: () => leagueAPI.myLeagues().then((r) => r.data?.leagues || r.data || []),
  });

  return (
    <FlatList
      style={{ backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}
      data={data || []}
      keyExtractor={(it: any) => it.id}
      ListEmptyComponent={
        <View style={{ alignItems: 'center', padding: theme.spacing.xxl }}>
          <Text style={{ color: theme.colors.textMuted }}>
            {isLoading ? 'Loading…' : 'No leagues yet. Create one on the web to get started.'}
          </Text>
        </View>
      }
      refreshControl={
        <RefreshControl
          refreshing={isFetching}
          onRefresh={() => qc.invalidateQueries({ queryKey: ['leagues'] })}
          tintColor={theme.colors.accent}
        />
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/league/${item.id}`)}
          style={({ pressed }) => [
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderWidth: 1,
              padding: theme.spacing.lg,
              borderRadius: theme.radius.md,
            },
            pressed && { opacity: 0.7 },
          ]}>
          <Text style={{ color: theme.colors.text, ...theme.typography.h1 }}>{item.name}</Text>
          <Text style={{ color: theme.colors.textMuted, ...theme.typography.small, marginTop: 4 }}>
            {(item.format || 'Head-to-Head').replace(/_/g, ' ')} · {item.sport || 'MLB'}
            {item.status ? ` · ${item.status}` : ''}
          </Text>
        </Pressable>
      )}
    />
  );
}