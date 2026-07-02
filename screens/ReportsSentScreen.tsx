import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RootStackScreenProps } from '../navigation/types';
import {
  useAppState,
  type ReportStatus,
  type ReportTargetType,
} from '../contexts/AppStateContext';
import { EmptyState } from '../components/common';
import { settingsStyles } from '../components/SettingsUI';
import { border, colors, radius, spacing, type } from '../theme/tokens';

type Props = RootStackScreenProps<'ReportsSent'>;

const TARGET_LABEL: Record<ReportTargetType, string> = {
  log: 'Avis',
  profile: 'Profil',
};

const STATUS_LABEL: Record<ReportStatus, string> = {
  open: 'En cours',
  resolved: 'Traité',
  dismissed: 'Rejeté',
};

const STATUS_COLOR: Record<ReportStatus, string> = {
  open: colors.cobalt,
  resolved: colors.acid,
  dismissed: colors.muted,
};

// Reports Sent. Lists the reports the current user has filed this session
// (AppStateContext.reports). NOTE: reports have no read-back query yet — real
// (uuid-target) reports are persisted to the `reports` table but this list is
// session-local, so it resets on restart (documented in the report + footer).
export default function ReportsSentScreen(_props: Props) {
  const { reports } = useAppState();

  if (reports.length === 0) {
    return (
      <View style={settingsStyles.container}>
        <EmptyState
          icon="🚩"
          title="Aucun signalement"
          message="Tu n'as envoyé aucun signalement. Ceux que tu envoies apparaîtront ici."
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={settingsStyles.container}
      contentContainerStyle={styles.content}
    >
      {reports.map((r) => (
        <View key={r.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.targetType}>{TARGET_LABEL[r.targetType]}</Text>
            <View style={[styles.badge, { backgroundColor: STATUS_COLOR[r.status] }]}>
              <Text
                style={[
                  styles.badgeText,
                  r.status === 'resolved' && styles.badgeTextOnAcid,
                ]}
              >
                {STATUS_LABEL[r.status]}
              </Text>
            </View>
          </View>
          <Text style={styles.reason}>{r.reason}</Text>
        </View>
      ))}
      <Text style={styles.footer}>
        Les signalements sont examinés par l'équipe de modération.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.sm },
  card: {
    backgroundColor: colors.bone,
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.none,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  targetType: { ...type.labelSm, color: colors.muted },
  badge: {
    borderWidth: border.hair,
    borderColor: colors.ink,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: { ...type.micro, fontSize: 10, color: colors.onInk },
  badgeTextOnAcid: { color: colors.onAcid },
  reason: { ...type.bodyMd, color: colors.ink },
  footer: {
    ...type.bodySm,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
