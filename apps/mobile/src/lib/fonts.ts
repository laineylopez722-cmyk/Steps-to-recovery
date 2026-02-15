/**
 * Font Configuration — Inter font family
 *
 * Loads the Inter font weights used throughout the app.
 * We load 4 weights to keep bundle lean while covering all UI needs:
 * - Regular (400): body text, descriptions
 * - Medium (500): labels, nav items, subtle emphasis
 * - SemiBold (600): headings, card titles, buttons
 * - Bold (700): hero numbers, strong emphasis
 */
export {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

/**
 * Font family names for use in styles.
 * These map to the loaded font assets above.
 */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export type FontWeight = keyof typeof fonts;
