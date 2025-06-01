import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTenantContext } from '@/context/tenantContext';

export default function HomeScreen() {
  const { tenant, loading} = useTenantContext()

  if (loading || !tenant) {
    return null;
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          //Here im using always the tenant1 icon, in prod you should use CDN urls that can be dynamically build with the app id
          //For example: `https://cdn.example.com/${tenant.slug}/icon.png`
          source={require('@/assets/images/tenant1/icon.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">MultiTenant!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Welcome to {tenant.name}</ThemedText>
        <ThemedText type="subtitle">Slug: {tenant.slug}</ThemedText>
        <ThemedText type="subtitle">Same codebase but diffent app configs</ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
