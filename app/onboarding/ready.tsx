import { View, Text, Animated, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Colors } from '../../constants/colors';
import KismetButton from '../../components/ui/KismetButton';
import { getZodiacSign } from '../../constants/zodiac';
import { useProfile } from '../../hooks/useProfile';
import i18n from '../../i18n';

export default function ReadyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { saveProfile } = useProfile();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const name = params.name as string || '';
  const day = parseInt(params.day as string) || 15;
  const month = parseInt(params.month as string) || 6;
  const year = parseInt(params.year as string) || 1995;
  const city = params.city as string || '';
  const gender = params.gender as string || '';
  const relation = params.relation as string || '';
  const focus = (params.focus as string || '').split(',').filter(Boolean);
  const interests = (params.interests as string || '').split(',').filter(Boolean);
  const experience = params.experience as string || '';
  const matchingOptIn = params.matchingOptIn === 'true';
  const guidanceOptIn = params.guidanceOptIn === 'true';

  const zodiac = getZodiacSign(day, month);
  const lang = i18n.locale as 'tr' | 'en';

  // Determine what the user will get based on their selections
  const isEligibleForMatching = relation === 'single' && focus.includes('love');

  const personalizedMessage = isEligibleForMatching
    ? {
        icon: '💫',
        titleTr: 'Kozmik Eşleşmeye Hazırsın',
        titleEn: 'Ready for Cosmic Matching',
        descTr: 'Seni tanıdıkça, burcuna ve enerjine uygun kişileri keşfetmene yardım edeceğiz. Her hafta Pazartesi yıldızların sana seçtiği özel bir eşleşme açılacak.',
        descEn: "As we get to know you, we'll help you discover people compatible with your zodiac and energy. Every Monday, a special match chosen by the stars will be revealed to you.",
      }
    : {
        icon: '🔮',
        titleTr: 'Kişisel Rehberlik Seni Bekliyor',
        titleEn: 'Personal Guidance Awaits',
        descTr: `Seni tanıdıkça, ${focus.includes('career') ? 'kariyerin' : focus.includes('health') ? 'sağlığın' : focus.includes('money') ? 'finansın' : focus.includes('family') ? 'ailen' : 'hayatın'} için her hafta sana özel öneriler hazırlayacağız. Yıldızlar ve AI birlikte çalışacak.`,
        descEn: `As we get to know you, we'll prepare weekly personalized guidance for your ${focus.includes('career') ? 'career' : focus.includes('health') ? 'health' : focus.includes('money') ? 'finances' : focus.includes('family') ? 'family' : 'life'}. The stars and AI will work together.`,
      };

  const handleComplete = async () => {
    await saveProfile({
      name,
      birthDay: day,
      birthMonth: month,
      birthYear: year,
      city,
      gender,
      relation,
      focus,
      interests,
      experience,
      matchingOptIn,
      guidanceOptIn,
    });
    // Route to auth sign-in to create account & sync to DB
    router.replace('/auth/sign-in');
  };

  const interestIcons: Record<string, string> = {
    coffee: '☕', tarot: '🃏', horoscope: '✨', dream: '🌙', palmface: '🖐️',
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.deep }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24, paddingTop: 60, paddingBottom: 40 }}
    >
      <Animated.View style={{ width: '100%', alignItems: 'center', opacity: fadeAnim }}>
        <Text style={{ fontSize: 56, marginBottom: 12 }}>{zodiac.symbol}</Text>
        <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 26, color: Colors.star, marginBottom: 6 }}>
          {i18n.t('onboarding.ready')}
        </Text>
        <Text style={{ fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 18, color: Colors.gold, marginBottom: 20 }}>
          {name}
        </Text>

        {/* Profile summary card */}
        <View style={{
          backgroundColor: 'rgba(212,165,116,0.08)',
          borderRadius: 20,
          padding: 16,
          width: '100%',
          maxWidth: 340,
          borderWidth: 1,
          borderColor: 'rgba(212,165,116,0.15)',
          marginBottom: 16,
          alignItems: 'center',
        }}>
          <Text style={{ fontFamily: 'PlayfairDisplay_400Regular', fontSize: 14, color: Colors.star, marginBottom: 10 }}>
            {zodiac[lang]} {zodiac.symbol} • {city || '—'}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {interests.map(i => (
              <View key={i} style={{ backgroundColor: 'rgba(212,165,116,0.15)', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: Colors.gold }}>
                  {interestIcons[i] || '✦'} {i18n.t('modules.' + i) || i}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Personalized promise card */}
        <View style={{
          backgroundColor: isEligibleForMatching ? 'rgba(139,92,246,0.1)' : 'rgba(212,165,116,0.08)',
          borderRadius: 20,
          padding: 20,
          width: '100%',
          maxWidth: 340,
          borderWidth: 1,
          borderColor: isEligibleForMatching ? 'rgba(139,92,246,0.3)' : 'rgba(212,165,116,0.2)',
          marginBottom: 28,
          alignItems: 'center',
        }}>
          <Text style={{ fontSize: 36, marginBottom: 10 }}>{personalizedMessage.icon}</Text>
          <Text style={{
            fontFamily: 'PlayfairDisplay_700Bold',
            fontSize: 16,
            color: isEligibleForMatching ? '#C4B5FD' : Colors.gold,
            textAlign: 'center',
            marginBottom: 8,
          }}>
            {lang === 'tr' ? personalizedMessage.titleTr : personalizedMessage.titleEn}
          </Text>
          <Text style={{
            fontFamily: 'PlayfairDisplay_400Regular',
            fontSize: 13,
            color: 'rgba(255,255,255,0.7)',
            textAlign: 'center',
            lineHeight: 20,
          }}>
            {lang === 'tr' ? personalizedMessage.descTr : personalizedMessage.descEn}
          </Text>
        </View>

        <KismetButton title={i18n.t('onboarding.readyCta')} onPress={handleComplete} />
      </Animated.View>
    </ScrollView>
  );
}
