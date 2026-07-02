// BROADSIDE component style presets for React Native.
//
// Reusable presets that mirror the component anatomy in design/design.md as
// closely as RN allows: solid fills inside hard 2px ink frames, zero radius on
// rectangles, full-pill chips, uppercase mono labels. Compose these in screen
// StyleSheets (e.g. style={[presets.btn, presets.btnPrimary]}).

import { forwardRef, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  type TextInputProps,
} from 'react-native';
import { border, colors, radius, spacing, type } from './tokens';

export const presets = StyleSheet.create({
  // ---- Screen scaffolding ----
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  ruleBottom: {
    borderBottomWidth: border.rule,
    borderBottomColor: colors.ink,
  },
  ruleTop: {
    borderTopWidth: border.rule,
    borderTopColor: colors.ink,
  },

  // ---- Buttons ----
  // Base: solid fill, 2px ink frame, zero radius, 52px tall.
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.none,
  },
  btnPrimary: { backgroundColor: colors.signal },
  btnSecondary: { backgroundColor: colors.paper },
  btnInk: { backgroundColor: colors.ink },
  btnAcid: { backgroundColor: colors.acid },
  btnCobalt: { backgroundColor: colors.cobalt },
  btnGhost: { backgroundColor: 'transparent' },
  btnDisabled: { opacity: 0.5 },

  // Button labels (uppercase Inter 700, 0.06em tracking). Pair color with fill.
  btnLabel: { ...type.button, color: colors.ink },
  btnLabelOnSignal: { color: colors.onSignal },
  btnLabelOnInk: { color: colors.onInk },
  btnLabelOnAcid: { color: colors.onAcid },
  btnLabelOnCobalt: { color: colors.onCobalt },
  btnLabelInk: { color: colors.ink },

  // ---- Cards ----
  // Bone surface inside a 2px ink frame, sharp corners, flat by default.
  card: {
    backgroundColor: colors.bone,
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.none,
    padding: spacing.lg,
  },
  cardHeader: {
    backgroundColor: colors.ink,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  cardHeaderText: { ...type.labelSm, color: colors.onInk },

  // ---- Inputs (see ThemedInput below for focus behavior) ----
  input: {
    backgroundColor: colors.stock,
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.none,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    ...type.bodyMd,
    color: colors.ink,
  },
  inputFocused: {
    backgroundColor: colors.paper,
    borderColor: colors.cobalt,
  },
  inputInvalid: {
    borderColor: colors.signal,
  },
  inputLabel: { ...type.labelSm, color: colors.ink, marginBottom: spacing.xs },
  inputHint: { ...type.micro, color: colors.muted, marginTop: spacing.xs },

  // ---- Chips / badges (full pill, mono uppercase) ----
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bone,
    borderWidth: border.rule,
    borderColor: colors.ink,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  chipInk: { backgroundColor: colors.ink },
  chipSignal: { backgroundColor: colors.signal },
  chipAcid: { backgroundColor: colors.acid },
  chipCobalt: { backgroundColor: colors.cobalt },
  chipText: { ...type.labelSm, color: colors.ink },
  chipTextOnInk: { color: colors.onInk },
  chipTextOnSignal: { color: colors.onSignal },
  chipTextOnAcid: { color: colors.onAcid },
  chipTextOnCobalt: { color: colors.onCobalt },

  // ---- Tabs (framed row joined by shared ink walls, no gap) ----
  tabsRow: {
    flexDirection: 'row',
    borderWidth: border.rule,
    borderColor: colors.ink,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  tabDivider: {
    borderLeftWidth: border.rule,
    borderLeftColor: colors.ink,
  },
  tabActive: { backgroundColor: colors.ink },
  tabLabel: {
    fontFamily: type.button.fontFamily,
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  tabLabelActive: { color: colors.acid },

  // ---- Sticker (rotated flag), brand mark ----
  sticker: {
    alignSelf: 'flex-start',
    backgroundColor: colors.signal,
    borderWidth: border.rule,
    borderColor: colors.ink,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    transform: [{ rotate: '-2deg' }],
  },
  stickerText: { ...type.labelSm, color: colors.onSignal },
  brandMark: {
    width: 14,
    height: 14,
    backgroundColor: colors.signal,
    borderWidth: border.rule,
    borderColor: colors.ink,
  },
});

// Focus-aware text input: stock fill by default, switches to paper + cobalt
// frame on focus, signal-red frame when `invalid`. Forwards ref + all props.
type ThemedInputProps = TextInputProps & { invalid?: boolean };

export const ThemedInput = forwardRef<TextInput, ThemedInputProps>(
  ({ invalid, style, onFocus, onBlur, placeholderTextColor, ...rest }, ref) => {
    const [focused, setFocused] = useState(false);
    return (
      <TextInput
        ref={ref}
        style={[
          presets.input,
          focused && presets.inputFocused,
          invalid && presets.inputInvalid,
          style,
        ]}
        placeholderTextColor={placeholderTextColor ?? colors.muted}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
    );
  }
);

ThemedInput.displayName = 'ThemedInput';
