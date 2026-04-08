import { useRouter } from 'expo-router';
import { useRef, useEffect, useState } from 'react';
import { Animated, Platform, ScrollView, Text, TouchableOpacity, View, Alert } from 'react-native';
import KismetButton from '../../components/ui/KismetButton';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { storage } from '../../services/storage';
import { syncToSupabase } from '../../hooks/useProfile';
import i18n from '../../i18n';

export default function SignInScreen() {
  const router = useRouter();
  const { signInWithApple, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const lang = i18n.locale as 'tr' | 'en';

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const handleAppleSignIn = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('', lang === 'tr' ? 'Apple giriş sadece iOS cihazlarda çalışır' : 'Apple Sign-In only works on iOS devices');
      return;
    }
    setLoading(true);
    try {
      const AppleAuth = require('expo-apple-authentication');
      const credential = await AppleAuth.signInAsync({
        requestedScopes: [
          AppleAuth.AppleAuthenticationScope.FULL_NAME,
          AppleAuth.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (credential.identityToken) {
        const success = await signInWithApple(credential.identityToken);
        if (success) {
          // Sync local profile to Supabase DB
          const localProfile = await storage.getProfile();
          if (localProfile) {
            await syncToSupabase(localProfile);
          }
          router.replace('/(tabs)/home');
          return;
        }
      }
      Alert.alert('', lang === 'tr' ? 'Giriş başarısız' : 'Sign-in failed');
    } catch (error: any) {
      if (error.code !== 'ERR_CANCELED') {
        console.error('Apple sign-in error:', error);
        Alert.alert('', error.message || 'Error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // Google Sign-In requires expo-auth-session setup
    // For MVP, show coming soon
    Alert.alert(
      '',
      lang === 'tr' ? 'Google giriş yakında aktif olacak. Şimdilik Apple ile giriş yapabilirsin.' : 'Google sign-in coming soon. Please use Apple Sign-In for now.'
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.deep }} contentContainerStyle={{ padding: 20, paddingTop: 80, alignItems: 'center', minHeight: '100%' }}>
      <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center', maxWidth: 380 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ alignSelf: 'flex-start', marginBottom: 24 }}>
          <Text style={{ color: Colors.gold, fontSize: 15, fontFamily: 'PlayfairDisplay_600SemiBold' }}>
            {i18n.t('common.back')}
          </Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 64, marginBottom: 16 }}>💫</Text>
        <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 26, color: Colors.star, textAlign: 'center', marginBottom: 8 }}>
          {lang === 'tr' ? 'Kozmik Eşleşme' : 'Cosmic Match'}
        </Text>
        <Text style={{ fontFamily: 'PlayfairDisplay_400Regular', fontSize: 14, color: Colors.gray, textAlign: 'center', lineHeight: 22, marginBottom: 40 }}>
          {lang === 'tr'
            ? 'Yıldızların sana seçtiği kişiyi keşfetmek için giriş yap. Burç uyumuna göre haftada 1 özel eşleşme.'
            : 'Sign in to discover who the stars chose for you. 1 special match per week based on zodiac compatibility.'}
        </Text>

        {/* Apple Sign-In */}
        <TouchableOpacity
          onPress={handleAppleSignIn}
          disabled={loading}
          activeOpacity={0.8}
          style={{
            width: '100%',
            backgroundColor: '#fff',
            borderRadius: 14,
            paddingVertical: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            marginBottom: 12,
            opacity: loading ? 0.6 : 1,
          }}
        >
          <Text style={{ fontSize: 20 }}></Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#000' }}>
            {lang === 'tr' ? 'Apple ile Giriş Yap' : 'Sign in with Apple'}
          </Text>
        </TouchableOpacity>

        {/* Google Sign-In */}
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={loading}
          activeOpacity={0.8}
          style={{
            width: '100%',
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.15)',
            borderRadius: 14,
            paddingVertical: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            marginBottom: 32,
          }}
        >
          <Text style={{ fontSize: 18 }}>G</Text>
          <Text style={{ fontSize: 16, fontWeight: '500', color: Colors.star }}>
            {lang === 'tr' ? 'Google ile Giriş Yap' : 'Sign in with Google'}
          </Text>
        </TouchableOpacity>

        {/* Skip option */}
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/home')}
          style={{ marginBottom: 20 }}
        >
          <Text style={{ color: Colors.gray, fontSize: 13, fontFamily: 'PlayfairDisplay_400Regular' }}>
            {lang === 'tr' ? 'Şimdilik atla →' : 'Skip for now →'}
          </Text>
        </TouchableOpacity>

        <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, textAlign: 'center', lineHeight: 16, maxWidth: 300 }}>
          {lang === 'tr'
            ? 'Giriş yaparak Gizlilik Politikası ve Kullanım Koşullarını kabul etmiş olursun.'
            : 'By signing in, you agree to our Privacy Policy and Terms of Service.'}
        </Text>
      </Animated.View>
    </ScrollView>
  );
}
