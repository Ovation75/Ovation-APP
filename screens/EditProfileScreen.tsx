import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackScreenProps } from '../navigation/types';
import { useAppState } from '../contexts/AppStateContext';
import { AppHeader } from '../components/AppHeader';
import { Avatar } from '../components/common';
import { ThemedInput } from '../theme/components';
import { supabase } from '../lib/supabase';
import { hapticSuccess } from '../lib/haptics';
import { border, colors, radius, spacing, type } from '../theme/tokens';

type Props = RootStackScreenProps<'EditProfile'>;

// Same rules as ProfileSetup (E01) so validation stays consistent.
const USERNAME_MIN = 3;
const USERNAME_MAX = 20;
const BIO_MAX = 150;
const DEBOUNCE_MS = 400;
const USERNAME_RE = /^[a-zA-Z0-9_.]+$/;

// Escape LIKE/ILIKE wildcards so an underscore in a username matches literally.
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

type UsernameStatus =
  | 'idle' // equals current username (unchanged) — always valid
  | 'too-short'
  | 'invalid'
  | 'checking'
  | 'available'
  | 'taken';

// Edit Profile (E09). Persists ONLY the columns that exist on `profiles`
// (username, bio, is_public) via updateMyProfile. The avatar is a placeholder —
// there is no avatar column and no upload pipeline yet (see report).
export default function EditProfileScreen({ navigation }: Props) {
  const { myProfile, myProfileLoading, currentUserId, updateMyProfile } = useAppState();

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [status, setStatus] = useState<UsernameStatus>('idle');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const checkToken = useRef(0);

  // Hydrate the form from current profile once it loads.
  useEffect(() => {
    if (myProfile && !hydrated) {
      setUsername(myProfile.username);
      setBio(myProfile.bio ?? '');
      setIsPublic(myProfile.isPublic);
      setHydrated(true);
    }
  }, [myProfile, hydrated]);

  const trimmedUsername = username.trim();
  const originalUsername = myProfile?.username ?? '';
  const usernameUnchanged =
    trimmedUsername.toLowerCase() === originalUsername.toLowerCase();

  const localValidity = (value: string): UsernameStatus | null => {
    if (value.length < USERNAME_MIN) return 'too-short';
    if (value.length > USERNAME_MAX || !USERNAME_RE.test(value)) return 'invalid';
    return null;
  };

  // Debounced uniqueness check — skipped when the username is unchanged (still
  // the user's own row) so editing only the bio/visibility never trips "taken".
  useEffect(() => {
    if (!hydrated) return;
    if (usernameUnchanged) {
      setStatus('idle');
      return;
    }
    const local = localValidity(trimmedUsername);
    if (local !== null) {
      setStatus(local);
      return;
    }
    setStatus('checking');
    const token = ++checkToken.current;
    const timer = setTimeout(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', escapeLike(trimmedUsername))
        .maybeSingle();
      if (token !== checkToken.current) return;
      if (error) {
        setStatus('idle');
        setSaveError('Impossible de vérifier le pseudo. Réessaie.');
        return;
      }
      // A row that is our own id doesn't count as taken.
      const takenByOther = data != null && data.id !== currentUserId;
      setStatus(takenByOther ? 'taken' : 'available');
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [trimmedUsername, usernameUnchanged, hydrated, currentUserId]);

  const bioRemaining = BIO_MAX - bio.length;

  // Something changed vs. the loaded profile?
  const dirty =
    hydrated &&
    (!usernameUnchanged ||
      (bio.trim() || null) !== (myProfile?.bio ?? null) ||
      isPublic !== myProfile?.isPublic);

  const usernameValid = usernameUnchanged || status === 'available';
  const canSave = hydrated && dirty && usernameValid && !saving;

  const onSave = async () => {
    if (!canSave) return;
    setSaveError(null);
    setSaving(true);
    const { error } = await updateMyProfile({
      username: trimmedUsername,
      bio: bio.trim() ? bio.trim() : null,
      isPublic,
    });
    setSaving(false);
    if (error) {
      setSaveError(error);
      return;
    }
    hapticSuccess();
    navigation.goBack();
  };

  const onCancel = () => {
    if (dirty) {
      Alert.alert('Annuler les modifications', 'Tes changements ne seront pas enregistrés.', [
        { text: 'Continuer l’édition', style: 'cancel' },
        { text: 'Annuler', style: 'destructive', onPress: () => navigation.goBack() },
      ]);
      return;
    }
    navigation.goBack();
  };

  const renderUsernameHint = () => {
    if (usernameUnchanged) return null;
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

  if (myProfileLoading && !hydrated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader title="Modifier mon profil" variant="plain" onBack={onCancel} />
        <ActivityIndicator style={styles.loading} color={colors.ink} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Modifier mon profil" variant="plain" onBack={onCancel} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Avatar placeholder — no upload pipeline yet */}
          <View style={styles.avatarBlock}>
            <Avatar name={username || originalUsername || '?'} size={88} />
            <Pressable
              style={styles.changePhoto}
              onPress={() =>
                Alert.alert('Bientôt disponible', 'Le changement de photo arrive prochainement.')
              }
              accessibilityRole="button"
            >
              <Text style={styles.changePhotoText}>Changer la photo</Text>
            </Pressable>
          </View>

          {/* Username */}
          <View style={styles.field}>
            <Text style={styles.label}>Pseudo</Text>
            <ThemedInput
              value={username}
              onChangeText={setUsername}
              placeholder="TON_PSEUDO"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={USERNAME_MAX}
              editable={!saving}
              invalid={!usernameUnchanged && (status === 'invalid' || status === 'taken')}
            />
            {renderUsernameHint()}
          </View>

          {/* Bio */}
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Bio</Text>
              <Text style={[styles.counter, bioRemaining < 0 && styles.counterOver]}>
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
              editable={!saving}
            />
          </View>

          {/* Visibility */}
          <View style={styles.field}>
            <Text style={styles.label}>Visibilité</Text>
            <View style={styles.segment}>
              {([true, false] as const).map((v, i) => (
                <Pressable
                  key={String(v)}
                  style={[
                    styles.segmentBtn,
                    i > 0 && styles.segmentBtnDivider,
                    isPublic === v && styles.segmentBtnActive,
                  ]}
                  onPress={() => setIsPublic(v)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isPublic === v }}
                >
                  <Text style={[styles.segmentText, isPublic === v && styles.segmentTextActive]}>
                    {v ? 'Public' : 'Privé'}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.inputHint}>
              {isPublic
                ? 'Ton journal et tes playlists publiques sont visibles par tous.'
                : 'Seuls tes abonnés approuvés voient ton contenu.'}
            </Text>
          </View>

          {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onCancel} disabled={saving}>
              <Text style={styles.cancelText}>Annuler</Text>
            </Pressable>
            <Pressable
              style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
              onPress={onSave}
              disabled={!canSave}
              accessibilityRole="button"
            >
              {saving ? (
                <ActivityIndicator color={colors.onSignal} />
              ) : (
                <Text style={styles.saveText}>Enregistrer</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  flex: { flex: 1 },
  loading: { marginTop: spacing.xl },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  avatarBlock: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  changePhoto: {
    marginTop: spacing.sm,
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.none,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bone,
  },
  changePhotoText: { ...type.button, fontSize: 12, color: colors.ink },
  field: { marginBottom: spacing.lg },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: { ...type.labelSm, color: colors.ink, marginBottom: spacing.xs },
  bioInput: { minHeight: 90, textAlignVertical: 'top' },
  counter: { ...type.micro, color: colors.muted },
  counterOver: { color: colors.signal },
  hint: { ...type.micro, marginTop: spacing.xs, color: colors.muted },
  hintOk: { ...type.micro, marginTop: spacing.xs, color: colors.cobalt },
  hintError: { ...type.micro, marginTop: spacing.xs, color: colors.signal },
  inputHint: { ...type.micro, color: colors.muted, marginTop: spacing.xs },
  segment: { flexDirection: 'row', borderWidth: border.rule, borderColor: colors.ink },
  segmentBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  segmentBtnDivider: { borderLeftWidth: border.rule, borderLeftColor: colors.ink },
  segmentBtnActive: { backgroundColor: colors.ink },
  segmentText: { ...type.button, fontSize: 13, color: colors.ink },
  segmentTextActive: { color: colors.acid },
  error: { ...type.bodySmMedium, color: colors.signal, marginBottom: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  cancelBtn: {
    flex: 1,
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.none,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.paper,
  },
  cancelText: { ...type.button, fontSize: 13, color: colors.ink },
  saveBtn: {
    flex: 1,
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.none,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.signal,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveText: { ...type.button, fontSize: 13, color: colors.onSignal },
});
