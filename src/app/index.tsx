import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.heroSection}>
          <View style={[styles.iconContainer, { backgroundColor: theme.backgroundElement }]}>
            <Feather name="globe" size={48} color={theme.text} />
          </View>
          <ThemedText type="subtitle" style={styles.title}>
            Orbit to Ground
          </ThemedText>
          <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
            Explore Earth from orbit
          </ThemedText>
        </View>

        <ThemedView type="backgroundElement" style={styles.infoCard}>
          <View style={styles.badgeRow}>
            <ThemedText type="code" style={styles.badgeText}>
              IN3210 • Space & Science
            </ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={styles.infoDescription}>
            Discover satellite imagery from NASA&apos;s Earth observation missions. Explore river
            deltas, coastal landscapes, and geologic formations captured from space.
          </ThemedText>

          <Pressable
            onPress={() => router.navigate('/explore')}
            style={({ pressed }) => [
              styles.ctaButton,
              { backgroundColor: theme.text },
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Explore NASA Earth Imagery">
            <Feather name="compass" size={18} color={theme.background} />
            <ThemedText style={[styles.ctaButtonText, { color: theme.background }]}>
              Explore NASA Imagery
            </ThemedText>
          </Pressable>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: BottomTabInset + Spacing.four,
    maxWidth: MaxContentWidth,
    paddingTop: Spacing.four,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: Spacing.two,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  title: {
    textAlign: 'center',
    fontWeight: '800',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
  },
  infoCard: {
    width: '100%',
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badgeText: {
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  infoDescription: {
    lineHeight: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.five,
    minHeight: 48,
  },
  ctaButtonText: {
    fontWeight: '700',
    fontSize: 15,
  },
  pressed: {
    opacity: 0.8,
  },
});
