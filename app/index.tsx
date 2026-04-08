import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { storage } from '../services/storage';
import { supabase } from '../services/supabase';
import { Colors } from '../constants/colors';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<string>('');

  useEffect(() => {
    checkState();
  }, []);

  const checkState = async () => {
    const onboardingDone = await storage.isOnboardingDone();

    if (!onboardingDone) {
      // Fresh user — start onboarding
      setRoute('/onboarding/welcome');
      setLoading(false);
      return;
    }

    // Onboarding done — go to home
    // Auth sync happens in background if user is signed in
    setRoute('/(tabs)/home');
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.deep, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  return <Redirect href={route as any} />;
}
