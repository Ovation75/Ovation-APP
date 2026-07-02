import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RootStackScreenProps } from '../navigation/types';
import { useAppState } from '../contexts/AppStateContext';
import type { ContentPreference } from '../contexts/AppStateContext';
import {
  Section,
  SwitchRow,
  Row,
  SelectChip,
  Segmented,
  settingsStyles,
} from '../components/SettingsUI';
import { CATEGORIES } from '../lib/shows';
import { colors, spacing, type } from '../theme/tokens';

type Props = RootStackScreenProps<'Preferences'>;

const CONTENT_OPTIONS: { value: ContentPreference; label: string }[] = [
  { value: 'popular', label: 'Populaire' },
  { value: 'recent', label: 'Récent' },
  { value: 'friends', label: 'Amis' },
];

// Area heading — separates the five preference areas within the scroll.
function Area({ label }: { label: string }) {
  return <Text style={styles.area}>{label}</Text>;
}

// Chip wrap laid out inside a Section card.
function ChipWrap({ children }: { children: React.ReactNode }) {
  return <View style={styles.chipWrap}>{children}</View>;
}

// Preferences (distinct from Settings). Everything here is LOCAL-ONLY state on
// AppStateContext — no user_preferences table exists yet (see the report and
// scripts/profile-preferences-schema.sql). The one exception is the visibility
// shortcut, which reads the real profile and jumps to EditProfile to change it.
export default function PreferencesScreen({ navigation }: Props) {
  const { preferences, setPreference, shows, myProfile } = useAppState();

  // Preferred venues are offered from the venues present in the loaded
  // catalogue (deduped, sorted) — no separate venues table to read from.
  const venues = useMemo(() => {
    const set = new Set<string>();
    for (const s of shows) for (const v of s.venues) set.add(v);
    return [...set].sort((a, b) => a.localeCompare(b, 'fr'));
  }, [shows]);

  const toggleInList = (key: 'preferredGenres' | 'preferredVenues', item: string) => {
    const current = preferences[key];
    setPreference(
      key,
      current.includes(item)
        ? current.filter((x) => x !== item)
        : [...current, item]
    );
  };

  return (
    <ScrollView
      style={settingsStyles.container}
      contentContainerStyle={settingsStyles.content}
    >
      {/* ---- Découverte ---- */}
      <Area label="Découverte" />

      <Section
        title="Genres préférés"
        footer="Sert à personnaliser tes recommandations."
      >
        <ChipWrap>
          {CATEGORIES.map((g) => (
            <SelectChip
              key={g}
              label={g}
              selected={preferences.preferredGenres.includes(g)}
              onPress={() => toggleInList('preferredGenres', g)}
            />
          ))}
        </ChipWrap>
      </Section>

      <Section title="Salles préférées">
        {venues.length === 0 ? (
          <Text style={styles.empty}>
            Le catalogue n'est pas encore chargé.
          </Text>
        ) : (
          <ChipWrap>
            {venues.map((v) => (
              <SelectChip
                key={v}
                label={v}
                selected={preferences.preferredVenues.includes(v)}
                onPress={() => toggleInList('preferredVenues', v)}
              />
            ))}
          </ChipWrap>
        )}
      </Section>

      <Section
        title="Contenu affiché en priorité"
        footer="Ordonne ta Découverte : les plus populaires, les plus récents, ou l'activité de tes amis d'abord."
      >
        <View style={styles.segmentBlock}>
          <Segmented
            options={CONTENT_OPTIONS}
            value={preferences.contentPreference}
            onChange={(v) => setPreference('contentPreference', v)}
          />
        </View>
      </Section>

      {/* ---- Feed ---- */}
      <Area label="Feed" />
      <Section title="Ce que tu vois dans le feed">
        <SwitchRow
          icon="👥"
          label="Activité des amis"
          description="Notes et avis des personnes que tu suis."
          value={preferences.feedFriendActivity}
          onValueChange={(v) => setPreference('feedFriendActivity', v)}
        />
        <SwitchRow
          icon="📰"
          label="Sélection éditoriale"
          description="Les coups de cœur de la rédaction."
          value={preferences.feedEditorial}
          onValueChange={(v) => setPreference('feedEditorial', v)}
        />
        <SwitchRow
          icon="✨"
          label="Recommandations"
          description="Suggestions basées sur tes goûts."
          value={preferences.feedRecommendations}
          onValueChange={(v) => setPreference('feedRecommendations', v)}
          last
        />
      </Section>

      {/* ---- Confidentialité ---- */}
      <Area label="Confidentialité" />
      <Section title="Visibilité">
        <Row
          icon="🔒"
          label="Visibilité du profil"
          value={myProfile ? (myProfile.isPublic ? 'Public' : 'Privé') : '—'}
          chevron
          onPress={() => navigation.navigate('EditProfile')}
          last
        />
      </Section>
      <Section title="Ce que les autres voient">
        <SwitchRow
          icon="⭐"
          label="Afficher mes notes"
          description="Tes notes apparaissent sur ton profil public."
          value={preferences.showRatings}
          onValueChange={(v) => setPreference('showRatings', v)}
        />
        <SwitchRow
          icon="🎟️"
          label="Afficher ma wishlist"
          description="Rendre visible ta liste d'envies."
          value={preferences.showWishlist}
          onValueChange={(v) => setPreference('showWishlist', v)}
          last
        />
      </Section>

      {/* ---- Notifications ---- */}
      <Area label="Notifications" />
      <Section
        title="Ce qui te notifie"
        footer="Réglages fins des notifications. Le canal global (push) se règle dans Paramètres."
      >
        <SwitchRow
          icon="👏"
          label="Applaudissements"
          value={preferences.notifyApplause}
          onValueChange={(v) => setPreference('notifyApplause', v)}
        />
        <SwitchRow
          icon="💬"
          label="Commentaires"
          value={preferences.notifyComments}
          onValueChange={(v) => setPreference('notifyComments', v)}
        />
        <SwitchRow
          icon="🙋"
          label="Demandes d'abonnement"
          value={preferences.notifyFollowRequests}
          onValueChange={(v) => setPreference('notifyFollowRequests', v)}
        />
        <SwitchRow
          icon="📰"
          label="Sélection éditoriale"
          value={preferences.notifyEditorial}
          onValueChange={(v) => setPreference('notifyEditorial', v)}
          last
        />
      </Section>

      {/* ---- Accessibilité ---- */}
      <Area label="Accessibilité" />
      <Section title="Affichage">
        <SwitchRow
          icon="🌀"
          label="Réduire les animations"
          description="Limite les transitions et effets de mouvement."
          value={preferences.reducedMotion}
          onValueChange={(v) => setPreference('reducedMotion', v)}
        />
        <SwitchRow
          icon="🃏"
          label="Cartes compactes"
          description="Affiche plus de contenu à l'écran."
          value={preferences.compactCards}
          onValueChange={(v) => setPreference('compactCards', v)}
        />
        <SwitchRow
          icon="🌙"
          label="Mode sombre"
          description="Bientôt disponible."
          value={preferences.darkMode}
          onValueChange={(v) => setPreference('darkMode', v)}
          last
        />
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  area: {
    ...type.displayMd,
    fontSize: 22,
    color: colors.ink,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  segmentBlock: { paddingVertical: spacing.md },
  empty: {
    ...type.bodySm,
    color: colors.muted,
    paddingVertical: spacing.md,
  },
});
