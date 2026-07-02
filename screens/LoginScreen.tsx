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
import { supabase } from '../lib/supabase';
import { hasProfile } from '../lib/profile';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { border, colors, radius, spacing, type } from '../theme/tokens';
import { ThemedInput } from '../theme/components';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedEmail = email.trim();

  const onSubmit = async () => {
    setError(null);
    if (!trimmedEmail || !password) {
      setError('Entre ton e-mail et ton mot de passe.');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

      if (signInError) {
        setError('E-mail ou mot de passe incorrect.');
        return;
      }

      // Route by whether profile setup was completed.
      let destination: keyof RootStackParamList = 'ProfileSetup';
      try {
        destination = (await hasProfile(data.user.id))
          ? 'Main'
          : 'ProfileSetup';
      } catch {
        destination = 'ProfileSetup';
      }

      navigation.reset({ index: 0, routes: [{ name: destination }] });
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
          <Text style={styles.heading}>Se connecter</Text>

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
              placeholder="TON MOT DE PASSE"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
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
            accessibilityLabel="Se connecter"
          >
            {submitting ? (
              <ActivityIndicator color={colors.onSignal} />
            ) : (
              <Text style={styles.ctaText}>Se connecter</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.linkRow}
            onPress={() => navigation.navigate('Signup')}
            disabled={submitting}
            hitSlop={8}
          >
            <Text style={styles.link}>Pas encore de compte ? S’inscrire</Text>
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
