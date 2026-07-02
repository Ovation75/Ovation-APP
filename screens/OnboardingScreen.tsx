import { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { border, colors, radius, spacing, type } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

type Slide = {
  key: string;
  title: string;
  subtitle?: string;
};

const SLIDES: Slide[] = [
  {
    key: 'slide-1',
    title: 'La scène parisienne mérite son réseau.',
  },
  {
    key: 'slide-2',
    title: 'Découvre. Partage. Note.',
  },
];

export default function OnboardingScreen({ navigation }: Props) {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const goToSignup = () => navigation.navigate('Signup');

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  };

  const isLast = index === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Skip link, top-right, on every slide */}
      <View style={styles.header}>
        <Pressable
          onPress={goToSignup}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Passer l'introduction"
        >
          <Text style={styles.skip}>Passer</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.pager}
      >
        {SLIDES.map((slide) => (
          <View key={slide.key} style={[styles.slide, { width }]}>
            <Text style={styles.title}>{slide.title}</Text>
            {slide.subtitle ? (
              <Text style={styles.subtitle}>{slide.subtitle}</Text>
            ) : null}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((slide, i) => (
            <View
              key={slide.key}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>

        {isLast ? (
          <Pressable
            style={styles.cta}
            onPress={goToSignup}
            accessibilityRole="button"
            accessibilityLabel="Commencer"
          >
            <Text style={styles.ctaText}>Commencer</Text>
          </Pressable>
        ) : (
          // Keep the footer height stable between slides.
          <View style={styles.ctaPlaceholder} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  skip: {
    ...type.labelSm,
    color: colors.muted,
  },
  pager: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    ...type.displayMd,
    color: colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    ...type.bodyMd,
    marginTop: spacing.md,
    color: colors.muted,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.none,
    borderWidth: border.rule,
    borderColor: colors.ink,
    backgroundColor: colors.paper,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: colors.ink,
    width: 20,
  },
  cta: {
    backgroundColor: colors.signal,
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.none,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  ctaText: {
    ...type.button,
    color: colors.onSignal,
  },
  ctaPlaceholder: {
    height: 52, // matches the CTA button height
  },
});
