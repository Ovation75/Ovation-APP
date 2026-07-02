// BROADSIDE design system — React Native token translation.
//
// Source: design/design.md (a CSS/web Uiverse system). This file adapts those
// tokens to React Native conventions:
//   - rem values are converted to density-independent px (1rem = 16px base).
//   - CSS box-shadow "offset" tokens become RN shadow* / elevation props.
//   - line-height (unitless CSS multiplier) becomes an absolute px value.
//   - letter-spacing (em) becomes an absolute px value (em * fontSize).
//   - font families map to the loaded @expo-google-fonts family names.
//
// The system is deliberately flat: hard 2px ink rules, zero radius on
// rectangles, full-pill radius on chips/badges, saturated signal colors.

import type { TextStyle, ViewStyle } from 'react-native';

// ---- Colors ----------------------------------------------------------------
export const colors = {
  // Stock (backgrounds)
  paper: '#F4EFE5', // primary background ("stock", warm cream)
  stock: '#EBE4D2', // recessed surface — input fields, inset panels
  bone: '#FBF8F1', // elevated surface — cards, chips
  // Ink (borders + type)
  ink: '#0A0A0A', // sole border color + dominant type
  inkSoft: '#1F1B16', // secondary copy
  muted: '#6B6357', // tertiary copy, placeholders
  // Signal (emphasis)
  signal: '#FF2D1A', // red — primary actions, danger, hero accents
  acid: '#D4FF3D', // chartreuse — highlights, active tabs, focus fills
  cobalt: '#1635E8', // blue — links, info, selected-input frame
  // On-color (paired contrast)
  onInk: '#F4EFE5',
  onSignal: '#FBF8F1',
  onAcid: '#0A0A0A',
  onCobalt: '#FBF8F1',
  // Semantic aliases (from design.md)
  primary: '#FF2D1A',
  secondary: '#D4FF3D',
  tertiary: '#1635E8',
  neutral: '#0A0A0A',
  surface: '#F4EFE5',
  onSurface: '#0A0A0A',
  border: '#0A0A0A',
  focus: '#1635E8',
  error: '#FF2D1A',
  success: '#D4FF3D',
} as const;

// ---- Spacing (rem -> px @ 16) ----------------------------------------------
export const spacing = {
  xxs: 4, // 0.25rem
  xs: 8, // 0.5rem
  sm: 12, // 0.75rem
  md: 16, // 1rem
  lg: 24, // 1.5rem
  xl: 32, // 2rem
  xxl: 48, // 3rem
  xxxl: 72, // 4.5rem
  xxxxl: 112, // 7rem
  gutter: 24, // 1.5rem — standard screen horizontal padding
} as const;

// ---- Radius ----------------------------------------------------------------
// Hard rectangles everywhere (0); full pill reserved for chips/badges/avatars.
export const radius = {
  none: 0,
  full: 999,
} as const;

// ---- Border widths ---------------------------------------------------------
export const border = {
  hair: 1, // "hair"
  rule: 2, // "rule" — the system default border
  bold: 4, // "bold"
} as const;

// ---- Font families (loaded via useFonts in App.tsx) ------------------------
// Each weight is a distinct font file, so weight is baked into the family and
// we avoid fontWeight (which would trigger faux-bolding on custom fonts).
export const fonts = {
  display: 'ArchivoBlack_400Regular', // Archivo Black (always weight 900)
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  mono: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_700Bold',
} as const;

// Map passed to expo-font's useFonts(). Import this in App.tsx.
// (require() calls live in App.tsx to keep asset resolution at the app root.)
export const FONT_FAMILY_NAMES = fonts;

// ---- Typography presets ----------------------------------------------------
// Faithful sizes from design.md. Note: hero (192) / displayXl (88) are kept for
// completeness but are impractical on a phone; screens use displayLg and below.
export const type = {
  hero: {
    fontFamily: fonts.display,
    fontSize: 192,
    lineHeight: 177, // 0.92
    letterSpacing: -3.84, // -0.02em
    textTransform: 'uppercase',
  },
  displayXl: {
    fontFamily: fonts.display,
    fontSize: 88,
    lineHeight: 81,
    letterSpacing: -1.76,
    textTransform: 'uppercase',
  },
  displayLg: {
    fontFamily: fonts.display,
    fontSize: 56,
    lineHeight: 52,
    letterSpacing: -1.12,
    textTransform: 'uppercase',
  },
  displayMd: {
    fontFamily: fonts.display,
    fontSize: 36,
    lineHeight: 36,
    letterSpacing: -0.36,
    textTransform: 'uppercase',
  },
  headlineLg: {
    fontFamily: fonts.bodyBold,
    fontSize: 24,
    lineHeight: 26,
  },
  headlineMd: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    lineHeight: 22,
  },
  bodyMd: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMdMedium: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySm: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
  },
  bodySmMedium: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 21,
  },
  labelSm: {
    fontFamily: fonts.mono,
    fontSize: 12,
    letterSpacing: 1.44, // 0.12em
    textTransform: 'uppercase',
  },
  micro: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.32, // 0.12em
    textTransform: 'uppercase',
  },
  // Button label: uppercase Inter 700 @ 0.06em tracking.
  button: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
} satisfies Record<string, TextStyle>;

// ---- Elevation / offset ----------------------------------------------------
// design.md is flat by definition (no blur, no gradient). The only depth token
// is the hard "offset duplicate": a solid color block 6px to the lower-right.
// In RN we approximate with a zero-blur shadow. This is faithful on iOS
// (shadowRadius 0 => hard edge). Android's `elevation` cannot render a colored,
// zero-blur, directional offset, so it falls back to a soft dark shadow — for a
// truly faithful hard offset on Android you must render a duplicate View behind.
function offset(color: string): ViewStyle {
  return {
    shadowColor: color,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  };
}

export const elevation = {
  flat: {} as ViewStyle,
  offsetInk: offset(colors.ink),
  offsetSignal: offset(colors.signal),
  offsetAcid: offset(colors.acid),
  offsetCobalt: offset(colors.cobalt),
} as const;
