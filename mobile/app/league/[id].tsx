import { ScrollView, View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { leagueAPI } from '../../src/services/api';
import { theme } from '../../src/theme';

export default function LeagueDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ['league', id],
    queryFn: () => leagueAPI.getLeague(id!).then((r) => r.data?.league || r.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View style={centerStyle}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }
  if (!data) {
    return (
      <View style={centerStyle}>
        <Text style={{ color: theme.colors.textMuted }}>League not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
      <View>
        <Text style={{ color: theme.colors.text, ...theme.typography.title }}>{data.name}</Text>
        <Text style={{ color: theme.colors.textMuted, marginTop: 4 }}>
          {(data.format || 'Head-to-Head').replace(/_/g, ' ')} · {data.sport || 'MLB'} · {data.maxTeams} teams
        </Text>
      </View>

      <InfoRow label="Status" value={String(data.status || '—').replace(/_/g, ' ')} />
      <InfoRow label="Scoring" value={String(data.scoringType || '—')} />
      <InfoRow label="Draft" value={String(data.draftType || '—').replace(/_/g, ' ')} />
      <InfoRow label="Season" value={String(data.seasonYear || '—')} />
      <InfoRow label="Invite code" value={data.inviteCode || '—'} mono />

      <Text style={{ color: theme.colors.textMuted, ...theme.typography.small, marginTop: 12 }}>
        Trades, draft rooms and commissioner controls are available on the web app.
      </Text>
    </ScrollView>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={{
      flexDirection: 'row', justifyContent: 'space-between',
      backgroundColor: theme.colors.card,
      borderColor: theme.colors.border, borderWidth: 1,
      padding: theme.spacing.md, borderRadius: theme.radius.md,
    }}>
      <Text style={{ color: theme.colors.textMuted }}>{label}</Text>
      <Text style={{ color: theme.colors.text, fontFamily: mono ? 'Courier' : undefined }}>
        {value}
      </Text>
    </View>
  );
}

const centerStyle = { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg } as const;