import { useState } from 'react';
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

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

const MIN_PASSWORD_LENGTH = 8;
// Pragmatic email shape check; the real source of truth is Supabase.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupScreen({ navigation }: Props) {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedFirstName = firstName.trim();
  const trimmedEmail = email.trim();

  const validate = (): string | null => {
    if (!trimmedFirstName) return 'Entre ton prénom.';
    if (!EMAIL_RE.test(trimmedEmail)) return 'Adresse e-mail invalide.';
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`;
    }
    if (password !== confirm) return 'Les mots de passe ne correspondent pas.';
    return null;
  };

  const onSubmit = async () => {
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          // profiles has no name column; keep first name in auth user metadata.
          data: { first_name: trimmedFirstName },
        },
      });

      if (signUpError) {
        // Supabase surfaces duplicate emails with this message.
        if (/already/i.test(signUpError.message)) {
          setError('Cette adresse e-mail est déjà utilisée.');
        } else {
          setError(signUpError.message);
        }
        return;
      }

      if (!data.session) {
        // No session means email confirmation is enabled on the project.
        setError(
          'Vérifie ta boîte mail pour confirmer ton compte, puis reconnecte-toi.'
        );
        return;
      }

      navigation.navigate('ProfileSetup');
    } catch (e) {
      setError('Une erreur est survenue. Réessaie.');
    } finally {
      setSubmitting(false);
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
          <Text style={styles.heading}>Créer ton compte</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Prénom</Text>
            <ThemedInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="TON PRÉNOM"
              autoCapitalize="words"
              autoComplete="given-name"
              returnKeyType="next"
              editable={!submitting}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>E-mail</Text>
            <ThemedInput
              value={email}
              onChangeText={setEmail}
              placeholder="TOI@EXEMPLE.COM"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              returnKeyType="next"
              editable={!submitting}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mot de passe</Text>
            <ThemedInput
              value={password}
              onChangeText={setPassword}
              placeholder="8 CARACTÈRES MINIMUM"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              returnKeyType="next"
              editable={!submitting}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirmer le mot de passe</Text>
            <ThemedInput
              value={confirm}
              onChangeText={setConfirm}
              placeholder="RETAPE TON MOT DE PASSE"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              returnKeyType="done"
              onSubmitEditing={onSubmit}
              editable={!submitting}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.cta, submitting && styles.ctaDisabled]}
            onPress={onSubmit}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel="Créer le compte"
          >
            {submitting ? (
              <ActivityIndicator color={colors.onSignal} />
            ) : (
              <Text style={styles.ctaText}>Créer mon compte</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.linkRow}
            onPress={() => navigation.navigate('Login')}
            disabled={submitting}
            hitSlop={8}
          >
            <Text style={styles.link}>Déjà un compte ? Se connecter</Text>
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
    marginBottom: spacing.md,
  },
  label: {
    ...type.labelSm,
    color: colors.ink,
    marginBottom: spacing.xs,
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
  linkRow: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  link: {
    ...type.labelSm,
    color: colors.cobalt,
  },
});
