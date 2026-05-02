import { useState } from 'react';
import { ScrollView, View, Text, RefreshControl, Pressable } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { statsAPI, sportsAPI } from '../../src/services/api';
import { theme } from '../../src/theme';

const SPORTS = ['MLB', 'NFL', 'NBA', 'NHL'] as const;
type Sport = typeof SPORTS[number];

export default function ScoresTab() {
  const [sport, setSport] = useState<Sport>('MLB');
  const qc = useQueryClient();

  const mlb = useQuery({
    queryKey: ['scoreboard', 'MLB'],
    queryFn: () => statsAPI.liveScoreboard().then((r) => r.data?.games || r.data?.scoreboard || []),
    enabled: sport === 'MLB',
    retry: false,
  });

  const other = useQuery({
    queryKey: ['scoreboard', sport],
    queryFn: () => sportsAPI.snapshot(sport as 'NFL' | 'NBA' | 'NHL').then((r) => r.data?.scoreboard || []),
    enabled: sport !== 'MLB',
    retry: false,
  });

  const games = sport === 'MLB' ? mlb.data : other.data;
  const loading = sport === 'MLB' ? mlb.isLoading : other.isLoading;
  const fetching = sport === 'MLB' ? mlb.isFetching : other.isFetching;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <View style={{
        flexDirection: 'row',
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}>
        {SPORTS.map((s) => (
          <Pressable
            key={s}
            onPress={() => setSport(s)}
            style={{
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
              borderRadius: theme.radius.pill,
              backgroundColor: sport === s ? theme.colors.accent : theme.colors.card,
            }}>
            <Text style={{
              color: sport === s ? theme.colors.bg : theme.colors.textMuted,
              fontWeight: '600',
            }}>{s}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}
        refreshControl={
          <RefreshControl
            refreshing={fetching}
            onRefresh={() => qc.invalidateQueries({ queryKey: ['scoreboard', sport] })}
            tintColor={theme.colors.accent}
          />
        }>
        {loading ? (
          <Text style={{ color: theme.colors.textMuted }}>Loading…</Text>
        ) : !games || games.length === 0 ? (
          <Text style={{ color: theme.colors.textMuted }}>No games for {sport} right now.</Text>
        ) : (
          games.map((g: any, i: number) => (
            <View key={i} style={{
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderWidth: 1,
              padding: theme.spacing.lg,
              borderRadius: theme.radius.md,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: theme.colors.text, ...theme.typography.h2 }}>
                  {g.away?.abbr || g.awayTeam || '—'}
                </Text>
                <Text style={{ color: theme.colors.text, ...theme.typography.h2 }}>
                  {g.away?.score ?? ''}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: theme.colors.text, ...theme.typography.h2 }}>
                  {g.home?.abbr || g.homeTeam || '—'}
                </Text>
                <Text style={{ color: theme.colors.text, ...theme.typography.h2 }}>
                  {g.home?.score ?? ''}
                </Text>
              </View>
              <Text style={{ color: theme.colors.textMuted, ...theme.typography.small, marginTop: 6 }}>
                {g.status || g.statusText || '—'}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}