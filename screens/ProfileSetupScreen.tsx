import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import type { RootStackParamList } from '../navigation/types';
import { border, colors, radius, spacing, type } from '../theme/tokens';
import { ThemedInput } from '../theme/components';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileSetup'>;

const USERNAME_MIN = 3;
const USERNAME_MAX = 20;
const BIO_MAX = 150;
const DEBOUNCE_MS = 400;

// Letters, digits, underscore and dot. Flagged as an assumption to validate.
const USERNAME_RE = /^[a-zA-Z0-9_.]+$/;

// Escape LIKE/ILIKE wildcards so the pattern matches literally. Without this,
// an underscore in a username would be treated as a single-char wildcard.
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

type UsernameStatus =
  | 'idle'
  | 'too-short'
  | 'invalid'
  | 'checking'
  | 'available'
  | 'taken';

export default function ProfileSetupScreen({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isPublic, setIsPublic] = useState<boolean | null>(null);
  const [status, setStatus] = useState<UsernameStatus>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Guards against out-of-order responses from overlapping checks.
  const checkToken = useRef(0);

  const trimmedUsername = username.trim();

  const localValidity = (value: string): UsernameStatus | null => {
    if (value.length === 0) return 'idle';
    if (value.length < USERNAME_MIN) return 'too-short';
    if (value.length > USERNAME_MAX || !USERNAME_RE.test(value)) {
      return 'invalid';
    }
    return null; // passes local checks, needs a uniqueness check
  };

  // Debounced live uniqueness check against the profiles table.
  useEffect(() => {
    const local = localValidity(trimmedUsername);
    if (local !== null) {
      setStatus(local);
      return;
    }

    setStatus('checking');
    const token = ++checkToken.current;

    const timer = setTimeout(async () => {
      // Case-insensitive uniqueness: "Malo" and "malo" collide. Escaped ilike
      // gives an anchored, wildcard-free case-insensitive match. This mirrors
      // the lower(username) unique index that must exist in the DB (see notes).
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', escapeLike(trimmedUsername))
        .maybeSingle();

      // Ignore if a newer check has started since this one was scheduled.
      if (token !== checkToken.current) return;

      if (error) {
        setStatus('idle');
        setSubmitError('Impossible de vérifier le pseudo. Réessaie.');
        return;
      }
      setStatus(data ? 'taken' : 'available');
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [trimmedUsername]);

  const bioRemaining = BIO_MAX - bio.length;
  const canSubmit =
    status === 'available' && isPublic !== null && !submitting;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setSubmitError('Session expirée. Reconnecte-toi.');
        return;
      }

      const { error } = await supabase.from('profiles').insert({
        id: user.id,
        username: trimmedUsername,
        bio: bio.trim() ? bio.trim() : null,
        is_public: isPublic,
      });

      if (error) {
        // Unique-violation code: username was taken in a race.
        if (error.code === '23505') {
          setStatus('taken');
          setSubmitError('Ce pseudo vient d’être pris. Choisis-en un autre.');
        } else {
          setSubmitError(error.message);
        }
        return;
      }

      // Replace the stack so the user can't navigate back into onboarding.
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e) {
      setSubmitError('Une erreur est survenue. Réessaie.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderUsernameHint = () => {
    switch (status) {
      case 'too-short':
        return <Text style={styles.hint}>Au moins {USERNAME_MIN} caractères.</Text>;
      case 'invalid':
        return (
          <Text style={styles.hintError}>
            3–20 caractères : lettres, chiffres, « _ » ou « . ».
          </Text>
        );
      case 'checking':
        return <Text style={styles.hint}>Vérification…</Text>;
      case 'available':
        return <Text style={styles.hintOk}>Disponible</Text>;
      case 'taken':
        return <Text style={styles.hintError}>Déjà pris</Text>;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heading}>Ton profil</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Pseudo</Text>
            <ThemedInput
              value={username}
              onChangeText={setUsername}
              placeholder="TON_PSEUDO"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={USERNAME_MAX}
              editable={!submitting}
              invalid={status === 'invalid' || status === 'taken'}
            />
            {renderUsernameHint()}
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Bio</Text>
              <Text
                style={[styles.counter, bioRemaining < 0 && styles.counterOver]}
              >
                {bioRemaining}
              </Text>
            </View>
            <ThemedInput
              style={styles.bioInput}
              value={bio}
              onChangeText={setBio}
              placeholder="QUELQUES MOTS SUR TOI (OPTIONNEL)"
              multiline
              maxLength={BIO_MAX}
              editable={!submitting}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Visibilité</Text>
            <View style={styles.segment}>
              <Pressable
                style={[
                  styles.segmentBtn,
                  isPublic === true && styles.segmentBtnActive,
                ]}
                onPress={() => setIsPublic(true)}
                accessibilityRole="button"
                accessibilityState={{ selected: isPublic === true }}
              >
                <Text
                  style={[
                    styles.segmentText,
                    isPublic === true && styles.segmentTextActive,
                  ]}
                >
                  Public
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.segmentBtn,
                  styles.segmentBtnDivider,
                  isPublic === false && styles.segmentBtnActive,
                ]}
                onPress={() => setIsPublic(false)}
                accessibilityRole="button"
                accessibilityState={{ selected: isPublic === false }}
              >
                <Text
                  style={[
                    styles.segmentText,
                    isPublic === false && styles.segmentTextActive,
                  ]}
                >
                  Privé
                </Text>
              </Pressable>
            </View>
          </View>

          {submitError ? <Text style={styles.error}>{submitError}</Text> : null}

          <Pressable
            style={[styles.cta, !canSubmit && styles.ctaDisabled]}
            onPress={onSubmit}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityLabel="Continuer"
          >
            {submitting ? (
              <ActivityIndicator color={colors.onSignal} />
            ) : (
              <Text style={styles.ctaText}>Continuer</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  heading: {
    ...type.displayMd,
    color: colors.ink,
    marginBottom: spacing.lg,
  },
  field: {
    marginBottom: spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    ...type.labelSm,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  bioInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  counter: {
    ...type.micro,
    color: colors.muted,
  },
  counterOver: {
    color: colors.signal,
  },
  hint: {
    ...type.micro,
    marginTop: spacing.xs,
    color: colors.muted,
  },
  hintOk: {
    ...type.micro,
    marginTop: spacing.xs,
    color: colors.cobalt,
  },
  hintError: {
    ...type.micro,
    marginTop: spacing.xs,
    color: colors.signal,
  },
  // Visibility choice rendered as a BROADSIDE tab pair (framed, no gap).
  segment: {
    flexDirection: 'row',
    borderWidth: border.rule,
    borderColor: colors.ink,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  segmentBtnDivider: {
    borderLeftWidth: border.rule,
    borderLeftColor: colors.ink,
  },
  segmentBtnActive: {
    backgroundColor: colors.ink,
  },
  segmentText: {
    ...type.button,
    fontSize: 13,
    color: colors.ink,
  },
  segmentTextActive: {
    color: colors.acid,
  },
  error: {
    ...type.bodySmMedium,
    color: colors.signal,
    marginBottom: spacing.sm,
  },
  cta: {
    backgroundColor: colors.signal,
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.none,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    ...type.button,
    color: colors.onSignal,
  },
});
