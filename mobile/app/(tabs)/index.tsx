import { ScrollView, View, Text, RefreshControl, Pressable } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { leagueAPI, statsAPI } from '../../src/services/api';
import { useAuthStore } from '../../src/stores/authStore';
import { theme } from '../../src/theme';

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const router = useRouter();

  const leagues = useQuery({
    queryKey: ['leagues'],
    queryFn: () => leagueAPI.myLeagues().then((r) => r.data?.leagues || r.data || []),
  });
  const scores = useQuery({
    queryKey: ['scoreboard'],
    queryFn: () => statsAPI.liveScoreboard().then((r) => r.data?.games || r.data?.scoreboard || []),
    retry: false,
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}
      refreshControl={
        <RefreshControl
          refreshing={leagues.isFetching || scores.isFetching}
          onRefresh={() => {
            qc.invalidateQueries({ queryKey: ['leagues'] });
            qc.invalidateQueries({ queryKey: ['scoreboard'] });
          }}
          tintColor={theme.colors.accent}
        />
      }>
      <View>
        <Text style={{ color: theme.colors.textMuted, ...theme.typography.small }}>
          Welcome back,
        </Text>
        <Text style={{ color: theme.colors.text, ...theme.typography.title }}>
          {user?.displayName || 'Manager'}
        </Text>
        {user?.tier && user.tier !== 'FREE' && (
          <View style={{
            marginTop: 6, alignSelf: 'flex-start',
            backgroundColor: theme.colors.accentMuted, paddingHorizontal: 10, paddingVertical: 4,
            borderRadius: theme.radius.pill,
          }}>
            <Text style={{ color: theme.colors.accent, ...theme.typography.tiny }}>
              {user.tier}
            </Text>
          </View>
        )}
      </View>

      <Section title="Your Leagues" cta="View all" onCta={() => router.push('/(tabs)/leagues')}>
        {leagues.isLoading ? (
          <Text style={{ color: theme.colors.textMuted }}>Loading…</Text>
        ) : (leagues.data || []).length === 0 ? (
          <EmptyCard text="You haven't joined any leagues yet." />
        ) : (
          (leagues.data || []).slice(0, 3).map((lg: any) => (
            <Pressable
              key={lg.id}
              onPress={() => router.push(`/league/${lg.id}`)}
              style={({ pressed }) => [cardStyle, pressed && { opacity: 0.7 }]}>
              <Text style={{ color: theme.colors.text, ...theme.typography.h2 }}>{lg.name}</Text>
              <Text style={{ color: theme.colors.textMuted, ...theme.typography.small }}>
                {(lg.format || 'Head-to-Head').replace(/_/g, ' ')} · {lg.sport || 'MLB'}
              </Text>
            </Pressable>
          ))
        )}
      </Section>

      <Section title="Live Scores">
        {scores.isLoading ? (
          <Text style={{ color: theme.colors.textMuted }}>Loading…</Text>
        ) : (scores.data || []).length === 0 ? (
          <EmptyCard text="No games right now." />
        ) : (
          (scores.data || []).slice(0, 5).map((g: any, i: number) => (
            <View key={i} style={cardStyle}>
              <Text style={{ color: theme.colors.text, ...theme.typography.h2 }}>
                {g.away?.abbr || g.awayTeam} @ {g.home?.abbr || g.homeTeam}
              </Text>
              <Text style={{ color: theme.colors.textMuted, ...theme.typography.small }}>
                {g.status || g.statusText || '—'}
              </Text>
            </View>
          ))
        )}
      </Section>
    </ScrollView>
  );
}

function Section({
  title, cta, onCta, children,
}: {
  title: string;
  cta?: string;
  onCta?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: theme.spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: theme.colors.text, ...theme.typography.h1 }}>{title}</Text>
        {cta && onCta && (
          <Pressable onPress={onCta}><Text style={{ color: theme.colors.accent }}>{cta} ›</Text></Pressable>
        )}
      </View>
      {children}
    </View>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <View style={[cardStyle, { alignItems: 'center', paddingVertical: theme.spacing.xl }]}>
      <Text style={{ color: theme.colors.textMuted }}>{text}</Text>
    </View>
  );
}

const cardStyle = {
  backgroundColor: theme.colors.card,
  borderColor: theme.colors.border,
  borderWidth: 1,
  padding: theme.spacing.lg,
  borderRadius: theme.radius.md,
  gap: 4,
} as const;