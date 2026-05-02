import { ScrollView, View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { playerAPI } from '../../src/services/api';
import { theme } from '../../src/theme';

export default function PlayerDetail() {
  const { mlbId } = useLocalSearchParams<{ mlbId: string }>();
  const id = Number(mlbId);

  const injury = useQuery({
    queryKey: ['player-injury', id],
    queryFn: () => playerAPI.getInjuryByMlbId(id).then((r) => r.data),
    enabled: Number.isFinite(id),
    retry: false,
  });
  const news = useQuery({
    queryKey: ['player-news', id],
    queryFn: () => playerAPI.getNewsByMlbId(id).then((r) => r.data),
    enabled: Number.isFinite(id),
    retry: false,
  });

  const valorNews: any[] = news.data?.valorOdds || [];
  const localNews: any[] = news.data?.news || [];
  const status = injury.data?.status ? injury.data : null;

  if (injury.isLoading && news.isLoading) {
    return (
      <View style={centerStyle}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.bg }}
      contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
      <Text style={{ color: theme.colors.text, ...theme.typography.title }}>Player #{id}</Text>

      {status && (
        <View style={{
          backgroundColor: theme.colors.card,
          borderLeftColor: theme.colors.danger, borderLeftWidth: 4,
          borderColor: theme.colors.border, borderWidth: 1,
          padding: theme.spacing.lg, borderRadius: theme.radius.md,
        }}>
          <Text style={{ color: theme.colors.danger, ...theme.typography.h2 }}>
            Injury: {status.status}
          </Text>
          {!!status.description && (
            <Text style={{ color: theme.colors.text, marginTop: 4 }}>{status.description}</Text>
          )}
          {!!status.expectedReturn && (
            <Text style={{ color: theme.colors.textMuted, marginTop: 4 }}>
              Expected return: {status.expectedReturn}
            </Text>
          )}
          <Text style={{ color: theme.colors.textMuted, ...theme.typography.tiny, marginTop: 8 }}>
            Powered by ValorOdds
          </Text>
        </View>
      )}

      {(valorNews.length > 0 || localNews.length > 0) && (
        <View style={{ gap: theme.spacing.md }}>
          <Text style={{ color: theme.colors.text, ...theme.typography.h1 }}>Latest News</Text>
          {(valorNews.length ? valorNews : localNews).slice(0, 10).map((n: any, i: number) => (
            <View key={i} style={{
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border, borderWidth: 1,
              padding: theme.spacing.md, borderRadius: theme.radius.md,
            }}>
              <Text style={{ color: theme.colors.text, ...theme.typography.h2 }}>
                {n.title || 'Update'}
              </Text>
              {!!n.body && (
                <Text style={{ color: theme.colors.textMuted, marginTop: 4 }}>{n.body}</Text>
              )}
              {!!n.publishedAt && (
                <Text style={{ color: theme.colors.textMuted, ...theme.typography.tiny, marginTop: 6 }}>
                  {new Date(n.publishedAt).toLocaleString()}{n.source ? ` · ${n.source}` : ''}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {!status && valorNews.length === 0 && localNews.length === 0 && (
        <Text style={{ color: theme.colors.textMuted }}>No news or injury updates right now.</Text>
      )}
    </ScrollView>
  );
}

const centerStyle = { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.bg } as const;