import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { RootStackScreenProps } from '../navigation/types';
import { useAppState } from '../contexts/AppStateContext';
import { EmptyState, Poster } from '../components/common';
import { ThemedInput } from '../theme/components';
import { hapticImpact, hapticSelect, hapticSuccess } from '../lib/haptics';
import { shareReview } from '../lib/share';
import { normalizeText } from '../lib/text';
import { border, colors, radius, spacing, type } from '../theme/tokens';

type Props = RootStackScreenProps<'LogFlow'>;

const REVIEW_MAX = 500;

// Interactive 0–5 rating with 0.5 steps = 10 tap targets (each star has a
// left/right half). A clipped filled star overlays an empty outline so half
// values render faithfully.
function RatingInput({
  value,
  onChange,
  size = 44,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  return (
    <View style={styles.starsRow}>
      {[0, 1, 2, 3, 4].map((i) => {
        const starValue = i + 1;
        const fill = value >= starValue ? 1 : value >= starValue - 0.5 ? 0.5 : 0;
        return (
          <View key={i} style={{ width: size, height: size }}>
            <Text style={[styles.star, { fontSize: size, color: colors.muted }]}>
              ☆
            </Text>
            {fill > 0 && (
              <View
                style={[
                  styles.starFillClip,
                  { width: size * fill, height: size },
                ]}
              >
                <Text
                  style={[
                    styles.star,
                    { fontSize: size, width: size, color: colors.signal },
                  ]}
                >
                  ★
                </Text>
              </View>
            )}
            <Pressable
              style={[styles.starHalf, { width: size / 2, height: size, left: 0 }]}
              onPress={() => onChange(i + 0.5)}
              accessibilityRole="button"
              accessibilityLabel={`Noter ${i + 0.5} sur 5`}
            />
            <Pressable
              style={[styles.starHalf, { width: size / 2, height: size, right: 0 }]}
              onPress={() => onChange(i + 1)}
              accessibilityRole="button"
              accessibilityLabel={`Noter ${i + 1} sur 5`}
            />
          </View>
        );
      })}
    </View>
  );
}

export default function LogFlowScreen({ route, navigation }: Props) {
  const paramShowId = route.params?.showId;
  const {
    getLogForShow,
    addOrUpdateLog,
    removeLog,
    shows,
    showsLoading,
    getShowById,
  } = useAppState();

  // Step 1 (search) is skipped when a show is already known.
  const [selectedShowId, setSelectedShowId] = useState<string | undefined>(
    paramShowId
  );
  const [step, setStep] = useState<'search' | 'rate' | 'done'>(
    paramShowId ? 'rate' : 'search'
  );
  const [query, setQuery] = useState('');

  const existingLog = selectedShowId
    ? getLogForShow(selectedShowId)
    : undefined;
  const isEditing = existingLog != null;

  const [rating, setRating] = useState(existingLog?.rating ?? 0);
  const [review, setReview] = useState(existingLog?.review ?? '');
  // Async submit: brief spinner before the confirmation state.
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Auto-return timer for the confirmation — cancelled if the user shares.
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Never let the auto-return fire after the screen is gone (e.g. Android
  // hardware back during the confirmation) — it would pop an extra screen.
  useEffect(
    () => () => {
      if (doneTimer.current) clearTimeout(doneTimer.current);
    },
    []
  );

  const show = selectedShowId ? getShowById(selectedShowId) : undefined;

  useLayoutEffect(() => {
    navigation.setOptions({
      title:
        step === 'search'
          ? 'Noter un spectacle'
          : isEditing
          ? 'Modifier mon avis'
          : 'Noter',
      // Modal presentation has no back arrow — give an explicit close.
      headerLeft:
        step === 'done'
          ? undefined
          : () => (
              <Pressable hitSlop={12} onPress={() => navigation.goBack()}>
                <Text style={styles.cancel}>Annuler</Text>
              </Pressable>
            ),
    });
  }, [navigation, step, isEditing]);

  const results = useMemo(() => {
    const q = normalizeText(query);
    if (!q) return shows;
    return shows.filter((s) =>
      normalizeText(`${s.title} ${s.company ?? ''} ${s.venues.join(' ')}`).includes(q)
    );
  }, [query, shows]);

  const pickRating = (v: number) => {
    hapticSelect();
    setRating(v);
  };

  const selectShow = (showId: string) => {
    const log = getLogForShow(showId);
    setSelectedShowId(showId);
    setRating(log?.rating ?? 0);
    setReview(log?.review ?? '');
    setStep('rate');
  };

  const submit = async () => {
    if (!selectedShowId || rating === 0 || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    const { error } = await addOrUpdateLog(selectedShowId, rating, review);
    setSubmitting(false);
    if (error) {
      setSubmitError(error);
      return;
    }
    hapticSuccess();
    setStep('done');
    // Return to the previous screen after showing the confirmation.
    doneTimer.current = setTimeout(() => navigation.goBack(), 2200);
  };

  const shareFromDone = () => {
    // Sharing cancels the auto-return so the sheet isn't ripped away.
    if (doneTimer.current) {
      clearTimeout(doneTimer.current);
      doneTimer.current = null;
    }
    if (show) shareReview('J’ai', show.title, rating, review);
  };

  const confirmDelete = () => {
    if (!selectedShowId) return;
    Alert.alert(
      'Supprimer mon avis',
      'Ton avis et ta note seront supprimés. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            hapticImpact();
            const { error } = await removeLog(selectedShowId);
            if (error) {
              Alert.alert('Erreur', error);
              return;
            }
            navigation.goBack();
          },
        },
      ]
    );
  };

  // ---- Confirmation state -------------------------------------------------
  if (step === 'done') {
    return (
      <View style={styles.doneWrap}>
        <Text style={styles.doneCheck}>✓</Text>
        <Text style={styles.doneText}>Ton avis est publié</Text>
        <View style={styles.doneActions}>
          <Pressable
            style={styles.doneShareBtn}
            onPress={shareFromDone}
            accessibilityRole="button"
            accessibilityLabel="Partager mon avis"
          >
            <Text style={styles.doneShareText}>↗ Partager</Text>
          </Pressable>
          <Pressable
            style={styles.doneCloseBtn}
            onPress={() => {
              if (doneTimer.current) clearTimeout(doneTimer.current);
              navigation.goBack();
            }}
            accessibilityRole="button"
          >
            <Text style={styles.doneCloseText}>Terminé</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ---- Step 1: catalogue search ------------------------------------------
  if (step === 'search') {
    return (
      <View style={styles.container}>
        <View style={styles.searchWrap}>
          <Text style={styles.stepLabel}>Quel spectacle veux-tu noter ?</Text>
          <ThemedInput
            value={query}
            onChangeText={setQuery}
            placeholder="RECHERCHER UN SPECTACLE"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
        </View>
        <ScrollView
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
        >
          {showsLoading ? (
            <ActivityIndicator style={styles.loading} color={colors.ink} />
          ) : results.length === 0 ? (
            <EmptyState
              icon="🎭"
              title="Aucun spectacle"
              message={`Rien ne correspond à « ${query.trim()} » dans le catalogue.`}
              ctaLabel="Effacer la recherche"
              onCtaPress={() => setQuery('')}
            />
          ) : null}
          {results.map((s) => (
            <Pressable
              key={s.id}
              style={styles.resultRow}
              onPress={() => selectShow(s.id)}
            >
              <Poster style={styles.resultPoster} label="" />
              <View style={styles.resultText}>
                <Text style={styles.resultTitle}>{s.title}</Text>
                <Text style={styles.resultSub}>{s.venues[0]}</Text>
              </View>
              {getLogForShow(s.id) ? (
                <Text style={styles.alreadyLogged}>✓ Déjà vu</Text>
              ) : null}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  }

  // ---- Step 2: rating + review -------------------------------------------
  if (!show) {
    return (
      <View style={styles.doneWrap}>
        <Text style={styles.doneText}>Spectacle introuvable.</Text>
      </View>
    );
  }

  const remaining = REVIEW_MAX - review.length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.rateContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.showHeader}>
        <Poster style={styles.showPoster} label="" />
        <View style={styles.showHeaderText}>
          <Text style={styles.showTitle}>{show.title}</Text>
          <Text style={styles.showCompany}>{show.company}</Text>
        </View>
      </View>

      <Text style={styles.stepLabel}>Ta note</Text>
      <RatingInput value={rating} onChange={pickRating} />
      <Text style={styles.ratingValue}>
        {rating > 0
          ? `${rating.toFixed(1).replace('.', ',')} / 5`
          : 'Touche les étoiles pour noter'}
      </Text>

      <Text style={[styles.stepLabel, styles.reviewLabel]}>
        Ton avis (facultatif)
      </Text>
      <TextInput
        style={styles.reviewInput}
        value={review}
        onChangeText={(t) => setReview(t.slice(0, REVIEW_MAX))}
        placeholder="Partage ton ressenti…"
        placeholderTextColor={colors.muted}
        multiline
        maxLength={REVIEW_MAX}
        textAlignVertical="top"
      />
      <Text style={styles.counter}>{remaining} caractères restants</Text>

      {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

      <Pressable
        style={[
          styles.submitBtn,
          (rating === 0 || submitting) && styles.submitBtnDisabled,
        ]}
        onPress={submit}
        disabled={rating === 0 || submitting}
        accessibilityRole="button"
        accessibilityState={{ disabled: rating === 0 || submitting, busy: submitting }}
      >
        {submitting ? (
          <View style={styles.submitBusy}>
            <ActivityIndicator size="small" color={colors.onSignal} />
            <Text style={styles.submitBtnText}>Publication…</Text>
          </View>
        ) : (
          <Text style={styles.submitBtnText}>
            {isEditing ? 'Enregistrer' : 'Publier mon avis'}
          </Text>
        )}
      </Pressable>

      {isEditing ? (
        <Pressable
          style={styles.deleteBtn}
          onPress={confirmDelete}
          accessibilityRole="button"
        >
          <Text style={styles.deleteBtnText}>Supprimer mon avis</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },

  // Search step
  searchWrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  stepLabel: {
    ...type.labelSm,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: border.rule,
    borderBottomColor: colors.ink,
  },
  resultPoster: { width: 44, height: 60 },
  resultText: { marginLeft: spacing.sm, flex: 1 },
  resultTitle: { ...type.headlineMd, fontSize: 16, color: colors.ink },
  resultSub: { ...type.micro, color: colors.muted, marginTop: 2 },
  alreadyLogged: { ...type.labelSm, color: colors.cobalt },

  // Rate step
  rateContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  showHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  showPoster: { width: 56, height: 76 },
  showHeaderText: { marginLeft: spacing.md, flex: 1 },
  showTitle: { ...type.headlineLg, fontSize: 20, color: colors.ink },
  showCompany: { ...type.bodySm, color: colors.muted, marginTop: 2 },
  starsRow: { flexDirection: 'row', gap: spacing.xs },
  star: {
    textAlign: 'center',
    includeFontPadding: false,
  },
  starFillClip: {
    position: 'absolute',
    left: 0,
    top: 0,
    overflow: 'hidden',
  },
  starHalf: { position: 'absolute', top: 0 },
  ratingValue: {
    ...type.bodyMdMedium,
    color: colors.inkSoft,
    marginTop: spacing.sm,
  },
  reviewLabel: { marginTop: spacing.xl },
  reviewInput: {
    backgroundColor: colors.stock,
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.none,
    padding: spacing.md,
    minHeight: 120,
    ...type.bodyMd,
    color: colors.ink,
  },
  counter: {
    ...type.micro,
    color: colors.muted,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
  submitBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.signal,
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.none,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { ...type.button, color: colors.onSignal },
  deleteBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  deleteBtnText: { ...type.button, fontSize: 13, color: colors.signal },

  cancel: { ...type.button, fontSize: 13, color: colors.ink },

  // Done state
  doneWrap: {
    flex: 1,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  doneCheck: {
    fontSize: 64,
    color: colors.cobalt,
    marginBottom: spacing.md,
    fontFamily: type.displayMd.fontFamily,
  },
  doneText: {
    ...type.headlineLg,
    color: colors.ink,
    textAlign: 'center',
  },
  doneActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  doneShareBtn: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: border.rule,
    borderColor: colors.ink,
    backgroundColor: colors.bone,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  doneShareText: { ...type.button, fontSize: 13, color: colors.ink },
  doneCloseBtn: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: border.rule,
    borderColor: colors.ink,
    backgroundColor: colors.signal,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  doneCloseText: { ...type.button, fontSize: 13, color: colors.onSignal },
  submitBusy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  submitError: {
    ...type.bodySmMedium,
    color: colors.signal,
    marginTop: spacing.sm,
  },
  loading: { marginTop: spacing.xxl },
});
