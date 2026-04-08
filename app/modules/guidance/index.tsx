import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Badge from '../../../components/ui/Badge';
import KismetButton from '../../../components/ui/KismetButton';
import TypingText from '../../../components/ui/TypingText';
import { Colors } from '../../../constants/colors';
import { getZodiacSign } from '../../../constants/zodiac';
import { useProfile } from '../../../hooks/useProfile';
import { supabase } from '../../../services/supabase';
import i18n from '../../../i18n';
import { getAIReading } from '../../../services/api';

const GUIDANCE_KEY = '@kismet_weekly_guidance';

interface StoredGuidance {
  weekStart: string;
  reading: string;
}

function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  return monday.toISOString().split('T')[0];
}

export default function GuidanceModule() {
  const router = useRouter();
  const { profile } = useProfile();
  const [phase, setPhase] = useState<'check' | 'ready' | 'loading' | 'result' | 'error'>('check');
  const [reading, setReading] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const lang = i18n.locale as 'tr' | 'en';

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    checkExistingGuidance();
  }, []);

  const checkExistingGuidance = async () => {
    try {
      const stored = await AsyncStorage.getItem(GUIDANCE_KEY);
      if (stored) {
        const data: StoredGuidance = JSON.parse(stored);
        if (data.weekStart === getCurrentWeekStart() && data.reading) {
          setReading(data.reading);
          setPhase('result');
          return;
        }
      }
      setPhase('ready');
    } catch {
      setPhase('ready');
    }
  };

  const getGuidance = async () => {
    if (!profile) return;
    setPhase('loading');

    const zodiac = getZodiacSign(profile.birthDay, profile.birthMonth);
    const relation = profile.relation || 'single';
    const focus = (profile.focus || []).join(', ');

    // Fetch extra personalization from Supabase
    let extraContext = '';
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: dbProfile } = await supabase
          .from('profiles')
          .select('career_field, career_goal, health_focus, finance_goal, relationship_goal')
          .eq('id', session.user.id)
          .single();
        if (dbProfile) {
          const parts = [];
          if (dbProfile.career_field) parts.push(lang === 'tr' ? `Çalışma alanı: ${dbProfile.career_field}` : `Work field: ${dbProfile.career_field}`);
          if (dbProfile.career_goal) parts.push(lang === 'tr' ? `Kariyer hedefi: ${dbProfile.career_goal}` : `Career goal: ${dbProfile.career_goal}`);
          if (dbProfile.health_focus) parts.push(lang === 'tr' ? `Sağlık odağı: ${dbProfile.health_focus}` : `Health focus: ${dbProfile.health_focus}`);
          if (dbProfile.finance_goal) parts.push(lang === 'tr' ? `Finansal hedef: ${dbProfile.finance_goal}` : `Finance goal: ${dbProfile.finance_goal}`);
          if (dbProfile.relationship_goal) parts.push(lang === 'tr' ? `İlişki hedefi: ${dbProfile.relationship_goal}` : `Relationship goal: ${dbProfile.relationship_goal}`);
          if (parts.length > 0) extraContext = '\n- ' + parts.join('\n- ');
        }
      }
    } catch { /* ignore - use basic context */ }

    const situationMap: Record<string, Record<string, string>> = {
      tr: { single: 'Bekar', relation: 'İlişkide', married: 'Evli', complicated: 'Karmaşık' },
      en: { single: 'Single', relation: 'In a relationship', married: 'Married', complicated: 'Complicated' },
    };
    const relationText = situationMap[lang]?.[relation] || relation;

    const promptText = lang === 'tr'
      ? `HAFTALIK KOZMİK REHBERLİK İSTEĞİ:

Kullanıcı bilgileri:
- İsim: ${profile.name}
- Burç: ${zodiac[lang]}
- İlişki durumu: ${relationText}
- Hayat odağı: ${focus}
- Cinsiyet: ${profile.gender}${extraContext}

Bu haftanın tarih aralığı: ${getCurrentWeekStart()} haftası

Bu kullanıcı için bu haftaya özel, ÇOK KİŞİSEL kozmik rehberlik oluştur:
1. Bu haftanın genel enerji yorumu (burca göre)
2. Kullanıcının hayat odağına ve detay bilgilerine ÖZEL tavsiyeler
3. Haftanın en güçlü günü ve ne yapması gerektiği
4. Pratik, aksiyon odaklı 2-3 spesifik öneri
5. Haftanın olumlu affirmasyonu

Kullanıcıya ismiyle hitap et. Sıcak, kişisel ve motive edici ol. 4-5 paragraf yaz.`
      : `WEEKLY COSMIC GUIDANCE REQUEST:

User info:
- Name: ${profile.name}
- Zodiac: ${zodiac[lang]}
- Relationship: ${relationText}
- Life focus: ${focus}
- Gender: ${profile.gender}${extraContext}

This week: ${getCurrentWeekStart()} week

Create HIGHLY PERSONALIZED cosmic guidance for this user:
1. This week's general energy reading (based on zodiac)
2. Advice SPECIFIC to their life focus and detail info
3. The most powerful day of the week and what to do
4. 2-3 practical, specific action-oriented suggestions
5. Positive affirmation for the week

Address user by name. Be warm, personal and motivating. Write 4-5 paragraphs.`;

    const userProfile = {
      name: profile.name,
      zodiacSign: zodiac[lang],
      gender: profile.gender,
      relation: profile.relation,
      focus: profile.focus,
    };

    const response = await getAIReading({
      type: 'dream', // Reuse dream type (text-based, uses Haiku)
      lang,
      dreamText: promptText,
      userProfile,
    });

    if (response.success && response.reading) {
      setReading(response.reading);
      setPhase('result');
      // Save for the week
      await AsyncStorage.setItem(GUIDANCE_KEY, JSON.stringify({
        weekStart: getCurrentWeekStart(),
        reading: response.reading,
      }));
    } else {
      setErrorMsg(response.error || (lang === 'tr' ? 'Bir hata oluştu' : 'An error occurred'));
      setPhase('error');
    }
  };

  // Icon and title based on user's focus
  const focusIcon = () => {
    const focus = profile?.focus || [];
    if (focus.includes('love')) return '💝';
    if (focus.includes('career')) return '💼';
    if (focus.includes('money')) return '💰';
    if (focus.includes('health')) return '🌿';
    if (focus.includes('family')) return '👨‍👩‍👧';
    if (focus.includes('growth')) return '🌱';
    return '✨';
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.deep }} contentContainerStyle={{ padding: 20, paddingTop: 60, alignItems: 'center', paddingBottom: 100 }}>
      <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center', maxWidth: 380 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ alignSelf: 'flex-start', marginBottom: 16 }}>
          <Text style={{ color: Colors.gold, fontSize: 15, fontFamily: 'PlayfairDisplay_600SemiBold' }}>
            {i18n.t('common.back')}
          </Text>
        </TouchableOpacity>

        {/* ====== READY ====== */}
        {phase === 'ready' && (
          <View style={{ alignItems: 'center', width: '100%' }}>
            <Text style={{ fontSize: 56, marginBottom: 12 }}>{focusIcon()}</Text>
            <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: Colors.star, marginBottom: 4 }}>
              {lang === 'tr' ? 'Haftalık Kozmik Rehber' : 'Weekly Cosmic Guide'}
            </Text>
            <Badge type="premium" />

            <View style={{
              backgroundColor: 'rgba(212,165,116,0.07)',
              borderWidth: 1,
              borderColor: 'rgba(212,165,116,0.15)',
              borderRadius: 16,
              padding: 16,
              marginTop: 24,
              width: '100%',
            }}>
              <Text style={{ fontFamily: 'PlayfairDisplay_400Regular', fontSize: 13, color: Colors.star, textAlign: 'center', lineHeight: 20 }}>
                {lang === 'tr'
                  ? `${profile?.name}, bu haftanın yıldız haritana göre kişisel kozmik rehberliğin hazır. Burcun, ilişki durumun ve hayat odağına göre özel öneriler alacaksın.`
                  : `${profile?.name}, your personalized cosmic guidance is ready based on this week's star map. You'll receive tailored advice based on your zodiac, relationship status, and life focus.`}
              </Text>
            </View>

            <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 16, marginBottom: 20, textAlign: 'center' }}>
              {lang === 'tr' ? '✨ Haftada 1 kez — Claude AI ile kişisel rehberlik' : '✨ Once per week — personalized guidance by Claude AI'}
            </Text>

            <KismetButton
              title={lang === 'tr' ? 'Rehberliğimi Al ✦' : 'Get My Guidance ✦'}
              onPress={getGuidance}
            />
          </View>
        )}

        {/* ====== LOADING ====== */}
        {phase === 'loading' && (
          <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
            <Text style={{ fontSize: 56, marginBottom: 16 }}>{focusIcon()}</Text>
            <Text style={{ color: Colors.goldLight, fontSize: 16, fontFamily: 'PlayfairDisplay_600SemiBold', marginBottom: 8 }}>
              {lang === 'tr' ? 'Kozmik rehberliğin hazırlanıyor...' : 'Preparing your cosmic guidance...'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
              {lang === 'tr' ? 'Claude AI analiz ediyor...' : 'Claude AI analyzing...'}
            </Text>
          </View>
        )}

        {/* ====== CHECK (loading saved) ====== */}
        {phase === 'check' && (
          <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
            <Text style={{ color: Colors.gray, fontSize: 13 }}>
              {lang === 'tr' ? 'Kontrol ediliyor...' : 'Checking...'}
            </Text>
          </View>
        )}

        {/* ====== RESULT ====== */}
        {phase === 'result' && (
          <View style={{ alignItems: 'center', width: '100%' }}>
            <Text style={{ fontSize: 48, marginBottom: 8 }}>{focusIcon()}</Text>
            <Text style={{ color: Colors.gold, fontSize: 13, fontFamily: 'PlayfairDisplay_700Bold', letterSpacing: 2, marginBottom: 4 }}>
              {lang === 'tr' ? 'BU HAFTANIN REHBERLİĞİN' : "THIS WEEK'S GUIDANCE"}
            </Text>
            <Text style={{ color: Colors.gray, fontSize: 11, marginBottom: 16 }}>
              {getCurrentWeekStart()} {lang === 'tr' ? 'haftası' : 'week'}
            </Text>

            <View style={{
              backgroundColor: 'rgba(212,165,116,0.07)',
              borderWidth: 1,
              borderColor: 'rgba(212,165,116,0.18)',
              borderRadius: 20,
              padding: 20,
              width: '100%',
              marginBottom: 24,
            }}>
              <TypingText
                text={reading}
                speed={12}
                style={{
                  color: 'rgba(255,255,255,0.85)',
                  lineHeight: 24,
                  fontSize: 15,
                  fontFamily: 'PlayfairDisplay_400Regular',
                }}
              />
            </View>

            <TouchableOpacity
              onPress={() => router.push('/modules/guidance/personalize')}
              style={{ marginTop: 16, marginBottom: 8 }}
            >
              <Text style={{ color: Colors.gold, fontSize: 13, fontFamily: 'PlayfairDisplay_600SemiBold' }}>
                ✨ {lang === 'tr' ? 'Daha kişisel öneriler için detay ekle' : 'Add details for more personal guidance'}
              </Text>
            </TouchableOpacity>

            <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, textAlign: 'center' }}>
              {lang === 'tr' ? 'Yeni rehberlik Pazartesi açılır' : 'New guidance unlocks on Monday'}
            </Text>
          </View>
        )}

        {/* ====== ERROR ====== */}
        {phase === 'error' && (
          <View style={{ alignItems: 'center', maxWidth: 380 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>⚠️</Text>
            <Text style={{ color: Colors.star, fontSize: 16, fontFamily: 'PlayfairDisplay_600SemiBold', marginBottom: 8 }}>
              {lang === 'tr' ? 'Bağlantı Hatası' : 'Connection Error'}
            </Text>
            <Text style={{ color: Colors.gray, fontSize: 13, textAlign: 'center', marginBottom: 24 }}>{errorMsg}</Text>
            <KismetButton title={lang === 'tr' ? 'Tekrar Dene' : 'Try Again'} onPress={() => setPhase('ready')} />
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}
