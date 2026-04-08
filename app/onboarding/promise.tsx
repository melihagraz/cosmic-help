import { View, Text, Animated, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Colors } from '../../constants/colors';
import KismetButton from '../../components/ui/KismetButton';
import ProgressDots from '../../components/ui/ProgressDots';
import i18n from '../../i18n';

export default function PromiseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const lang = i18n.locale as 'tr' | 'en';

  const relation = params.relation as string || '';
  const focus = (params.focus as string || '').split(',').filter(Boolean);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  const isEligibleForMatching = relation === 'single' && focus.includes('love');

  const message = isEligibleForMatching
    ? {
        icon: '💫',
        titleTr: 'Kozmik Eşleşme Seni Bekliyor',
        titleEn: 'Cosmic Match Awaits You',
        descTr: 'Bekar olduğunu ve aşkı aradığını söylediğin için sana özel bir özellik açıyoruz. Seni tanıdıkça, burcuna ve enerjine uygun kişileri keşfetmene yardım edeceğiz. Her hafta Pazartesi yıldızların sana seçtiği özel bir eşleşme açılacak.',
        descEn: 'Since you told us you\'re single and looking for love, we\'re unlocking a special feature for you. As we get to know you, we\'ll help you discover people compatible with your zodiac and energy. Every Monday, a special match chosen by the stars will be revealed to you.',
        bullet1Tr: '✦ Haftada 1 burç uyumlu eşleşme',
        bullet1En: '✦ 1 zodiac-compatible match per week',
        bullet2Tr: '✦ AI destekli kozmik uyum raporu',
        bullet2En: '✦ AI-powered cosmic compatibility report',
        bullet3Tr: '✦ Eşleşirsen mesajlaşma hakkı',
        bullet3En: '✦ Messaging when you mutually match',
        color: '#8B5CF6',
        bg: 'rgba(139,92,246,0.1)',
        border: 'rgba(139,92,246,0.3)',
      }
    : {
        icon: '🔮',
        titleTr: 'Kişisel Rehberliğin Hazırlanıyor',
        titleEn: 'Your Personal Guidance Awaits',
        descTr: `Seni tanıdıkça, ${focus.includes('career') ? 'kariyerin' : focus.includes('health') ? 'sağlığın' : focus.includes('money') ? 'finansın' : focus.includes('family') ? 'ailen' : 'hayatın'} için her hafta sana özel öneriler hazırlayacağız. Yıldızlar, burcun ve yapay zeka birlikte çalışarak sana rehberlik edecek.`,
        descEn: `As we get to know you, we'll prepare weekly personalized guidance for your ${focus.includes('career') ? 'career' : focus.includes('health') ? 'health' : focus.includes('money') ? 'finances' : focus.includes('family') ? 'family' : 'life'}. The stars, your zodiac, and AI will work together to guide you.`,
        bullet1Tr: '✦ Haftalık kişisel kozmik rehberlik',
        bullet1En: '✦ Weekly personal cosmic guidance',
        bullet2Tr: '✦ Burcuna ve hedeflerine özel öneriler',
        bullet2En: '✦ Advice tailored to your zodiac & goals',
        bullet3Tr: '✦ Her hafta yeni içerik',
        bullet3En: '✦ Fresh content every week',
        color: '#d4a574',
        bg: 'rgba(212,165,116,0.1)',
        border: 'rgba(212,165,116,0.3)',
      };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.deep }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24, paddingTop: 60, paddingBottom: 40 }}
    >
      <Animated.View style={{ width: '100%', alignItems: 'center', opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
        <ProgressDots step={5} total={6} />

        <Text style={{ fontSize: 72, marginBottom: 20, marginTop: 20 }}>{message.icon}</Text>

        <Text style={{
          fontFamily: 'PlayfairDisplay_700Bold',
          fontSize: 24,
          color: Colors.star,
          textAlign: 'center',
          marginBottom: 12,
          maxWidth: 320,
        }}>
          {lang === 'tr' ? message.titleTr : message.titleEn}
        </Text>

        <Text style={{
          fontFamily: 'PlayfairDisplay_400Regular',
          fontSize: 14,
          color: 'rgba(255,255,255,0.65)',
          textAlign: 'center',
          lineHeight: 22,
          maxWidth: 340,
          marginBottom: 24,
        }}>
          {lang === 'tr' ? message.descTr : message.descEn}
        </Text>

        {/* Feature bullets */}
        <View style={{
          backgroundColor: message.bg,
          borderRadius: 20,
          padding: 20,
          width: '100%',
          maxWidth: 340,
          borderWidth: 1,
          borderColor: message.border,
          marginBottom: 32,
          gap: 12,
        }}>
          <Text style={{ color: message.color, fontSize: 13, fontFamily: 'PlayfairDisplay_600SemiBold' }}>
            {lang === 'tr' ? message.bullet1Tr : message.bullet1En}
          </Text>
          <Text style={{ color: message.color, fontSize: 13, fontFamily: 'PlayfairDisplay_600SemiBold' }}>
            {lang === 'tr' ? message.bullet2Tr : message.bullet2En}
          </Text>
          <Text style={{ color: message.color, fontSize: 13, fontFamily: 'PlayfairDisplay_600SemiBold' }}>
            {lang === 'tr' ? message.bullet3Tr : message.bullet3En}
          </Text>
        </View>

        {/* Accept */}
        <KismetButton
          title={lang === 'tr' ? (isEligibleForMatching ? 'Evet, İstiyorum ✦' : 'Evet, Rehberlik Al ✦') : (isEligibleForMatching ? 'Yes, I Want This ✦' : 'Yes, Get Guidance ✦')}
          onPress={() => router.push({
            pathname: '/onboarding/interests',
            params: { ...params, [isEligibleForMatching ? 'matchingOptIn' : 'guidanceOptIn']: 'true' }
          })}
        />

        {/* Decline */}
        <TouchableOpacity
          onPress={() => router.push({
            pathname: '/onboarding/interests',
            params: { ...params, [isEligibleForMatching ? 'matchingOptIn' : 'guidanceOptIn']: 'false' }
          })}
          style={{ marginTop: 16, padding: 12 }}
        >
          <Text style={{
            color: 'rgba(255,255,255,0.4)',
            fontSize: 13,
            fontFamily: 'PlayfairDisplay_400Regular',
            textAlign: 'center',
          }}>
            {lang === 'tr' ? 'Şimdi değil, atla' : 'Not now, skip'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}
