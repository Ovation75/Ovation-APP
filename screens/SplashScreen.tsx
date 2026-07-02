import { useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, type } from '../theme/tokens';
import { supabase } from '../lib/supabase';
import { hasProfile } from '../lib/profile';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    let isMounted = true;

    // Show the splash for at least 2 seconds, then decide where to go
    // based on whether a Supabase session already exists on this device.
    const start = Date.now();

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Decide the destination while the splash minimum time elapses.
      // - No session          -> Onboarding
      // - Session + profile    -> Feed
      // - Session, no profile  -> ProfileSetup (signed up but never finished)
      let destination: keyof RootStackParamList = 'Onboarding';
      if (session) {
        try {
          destination = (await hasProfile(session.user.id))
            ? 'Main'
            : 'ProfileSetup';
        } catch {
          // If the profile lookup fails, fall back to ProfileSetup so an
          // authenticated user is never dropped back into Onboarding.
          destination = 'ProfileSetup';
        }
      }

      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 2000 - elapsed);

      setTimeout(() => {
        if (!isMounted) return;
        navigation.reset({
          index: 0,
          routes: [{ name: destination }],
        });
      }, remaining);
    })();

    return () => {
      isMounted = false;
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Ovation</Text>
      <Text style={styles.tagline}>Le Letterboxd de la scène</Text>
      <ActivityIndicator style={styles.spinner} color={colors.ink} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    ...type.displayLg,
    color: colors.ink,
  },
  tagline: {
    ...type.labelSm,
    marginTop: spacing.sm,
    color: colors.muted,
  },
  spinner: {
    marginTop: spacing.xl,
  },
});
