import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import KismetButton from '../../../components/ui/KismetButton';
import Badge from '../../../components/ui/Badge';
import MatchCard from '../../../components/matching/MatchCard';
import CountdownTimer from '../../../components/matching/CountdownTimer';
import { Colors } from '../../../constants/colors';
import { useAuth } from '../../../contexts/AuthContext';
import { useProfile } from '../../../hooks/useProfile';
import { getWeeklyMatch, likeMatch, passMatch, hasMatchingProfile, WeeklyMatch } from '../../../services/matching';
import i18n from '../../../i18n';

type Phase = 'loading' | 'no-auth' | 'no-profile' | 'no-match' | 'match' | 'acted' | 'mutual';

export default function MatchingHub() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { profile } = useProfile();
  const [phase, setPhase] = useState<Phase>('loading');
  const [match, setMatch] = useState<WeeklyMatch | null>(null);
  const [acted, setActed] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const lang = i18n.locale as 'tr' | 'en';

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    loadState();
  }, [isAuthenticated]);

  const loadState = async () => {
    if (!isAuthenticated) {
      setPhase('no-auth');
      return;
    }

    const hasProfile = await hasMatchingProfile();
    if (!hasProfile) {
      setPhase('no-profile');
      return;
    }

    const weeklyMatch = await getWeeklyMatch();
    if (!weeklyMatch) {
      setPhase('no-match');
      return;
    }

    setMatch(weeklyMatch);

    // Determine phase based on actions
    const myAction = weeklyMatch.user_a === user?.id ? weeklyMatch.user_a_action : weeklyMatch.user_b_action;
    if (weeklyMatch.is_mutual) {
      setPhase('mutual');
    } else if (myAction !== 'pending') {
      setActed(true);
      setPhase('acted');
    } else {
      setPhase('match');
    }
  };

  const handleLike = async () => {
    if (!match) return;
    const result = await likeMatch(match.id);
    if (result.success) {
      if (result.isMutual) {
        setPhase('mutual');
      } else {
        setActed(true);
        setPhase('acted');
      }
    }
  };

  const handlePass = async () => {
    if (!match) return;
    const result = await passMatch(match.id);
    if (result.success) {
      setActed(true);
      setPhase('acted');
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.deep }} contentContainerStyle={{ padding: 20, paddingTop: 60, alignItems: 'center', paddingBottom: 100 }}>
      <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center', maxWidth: 380 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ alignSelf: 'flex-start', marginBottom: 16 }}>
          <Text style={{ color: Colors.gold, fontSize: 15, fontFamily: 'PlayfairDisplay_600SemiBold' }}>
            {i18n.t('common.back')}
          </Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 48, marginBottom: 8 }}>💫</Text>
        <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: Colors.star, marginBottom: 4 }}>
          {lang === 'tr' ? 'Kozmik Eşleşme' : 'Cosmic Match'}
        </Text>
        <Badge type="premium" />

        {/* ====== NO AUTH ====== */}
        {phase === 'no-auth' && (
          <View style={{ alignItems: 'center', marginTop: 32 }}>
            <Text style={{ fontFamily: 'PlayfairDisplay_400Regular', fontSize: 14, color: Colors.gray, textAlign: 'center', lineHeight: 22, marginBottom: 24, maxWidth: 300 }}>
              {lang === 'tr'
                ? 'Yıldızların sana seçtiği kişiyi keşfet. Burç uyumuna göre haftada 1 özel eşleşme.'
                : 'Discover who the stars chose for you. 1 special match per week based on zodiac compatibility.'}
            </Text>
            <KismetButton
              title={lang === 'tr' ? 'Giriş Yap' : 'Sign In'}
              onPress={() => router.push('/auth/sign-in')}
            />
          </View>
        )}

        {/* ====== NO PROFILE ====== */}
        {phase === 'no-profile' && (
          <View style={{ alignItems: 'center', marginTop: 32 }}>
            <Text style={{ fontFamily: 'PlayfairDisplay_400Regular', fontSize: 14, color: Colors.gray, textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
              {lang === 'tr' ? 'Eşleşme profilini oluştur ve kozmik yolculuğuna başla.' : 'Create your match profile and start your cosmic journey.'}
            </Text>
            <KismetButton
              title={lang === 'tr' ? 'Profil Oluştur' : 'Create Profile'}
              onPress={() => router.push('/modules/matching/setup')}
            />
          </View>
        )}

        {/* ====== LOADING ====== */}
        {phase === 'loading' && (
          <View style={{ alignItems: 'center', marginTop: 48 }}>
            <Text style={{ color: Colors.gray, fontSize: 13 }}>
              {lang === 'tr' ? 'Yükleniyor...' : 'Loading...'}
            </Text>
          </View>
        )}

        {/* ====== NO MATCH THIS WEEK ====== */}
        {phase === 'no-match' && (
          <View style={{ alignItems: 'center', marginTop: 32 }}>
            <Text style={{ fontSize: 64, marginBottom: 16 }}>🌠</Text>
            <Text style={{ fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 16, color: Colors.star, textAlign: 'center', marginBottom: 8 }}>
              {lang === 'tr' ? 'Yıldızlar hizalanıyor...' : 'The stars are aligning...'}
            </Text>
            <Text style={{ fontFamily: 'PlayfairDisplay_400Regular', fontSize: 13, color: Colors.gray, textAlign: 'center', lineHeight: 20, marginBottom: 24, maxWidth: 280 }}>
              {lang === 'tr'
                ? 'Bu hafta henüz bir eşleşmen yok. Yeni eşleşmeler her Pazartesi açılır.'
                : "No match this week yet. New matches are revealed every Monday."}
            </Text>
            <CountdownTimer />
          </View>
        )}

        {/* ====== MATCH (pending action) ====== */}
        {phase === 'match' && match?.other_profile && (
          <View style={{ alignItems: 'center', marginTop: 20, width: '100%' }}>
            <Text style={{ fontFamily: 'PlayfairDisplay_400Regular', fontSize: 12, color: Colors.gray, marginBottom: 16 }}>
              {lang === 'tr' ? 'Bu haftanın kozmik eşleşmen' : "This week's cosmic match"}
            </Text>

            <MatchCard
              profile={match.other_profile}
              compatibilityScore={match.compatibility_score}
              isMutual={false}
              blurred={true}
            />

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, width: '100%' }}>
              <TouchableOpacity
                onPress={handlePass}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: Colors.gray, fontSize: 15, fontFamily: 'PlayfairDisplay_600SemiBold' }}>
                  {lang === 'tr' ? 'Geç' : 'Pass'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLike}
                style={{
                  flex: 2,
                  backgroundColor: 'rgba(212,165,116,0.2)',
                  borderWidth: 1,
                  borderColor: 'rgba(212,165,116,0.4)',
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: Colors.gold, fontSize: 15, fontFamily: 'PlayfairDisplay_700Bold' }}>
                  💫 {lang === 'tr' ? 'Beğen' : 'Like'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ====== ACTED (waiting for other) ====== */}
        {phase === 'acted' && (
          <View style={{ alignItems: 'center', marginTop: 32 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>⏳</Text>
            <Text style={{ fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 16, color: Colors.star, textAlign: 'center', marginBottom: 8 }}>
              {lang === 'tr' ? 'Yanıt bekleniyor...' : 'Waiting for response...'}
            </Text>
            <Text style={{ fontFamily: 'PlayfairDisplay_400Regular', fontSize: 13, color: Colors.gray, textAlign: 'center', lineHeight: 20, maxWidth: 280 }}>
              {lang === 'tr'
                ? 'Eşleşmen de seni beğenirse profiller açılacak ve kozmik uyum raporunuz hazırlanacak!'
                : 'If your match also likes you, profiles will be revealed along with your cosmic compatibility report!'}
            </Text>
            <View style={{ marginTop: 24 }}>
              <CountdownTimer />
            </View>
          </View>
        )}

        {/* ====== MUTUAL MATCH ====== */}
        {phase === 'mutual' && match?.other_profile && (
          <View style={{ alignItems: 'center', marginTop: 20, width: '100%' }}>
            <Text style={{ fontFamily: 'PlayfairDisplay_400Regular', fontSize: 12, color: Colors.gold, marginBottom: 16 }}>
              ✨ {lang === 'tr' ? 'Karşılıklı eşleşme!' : 'Mutual match!'}
            </Text>

            <MatchCard
              profile={match.other_profile}
              compatibilityScore={match.compatibility_score}
              isMutual={true}
              blurred={false}
            />

            <View style={{ marginTop: 20, width: '100%', gap: 12 }}>
              <KismetButton
                title={lang === 'tr' ? '🌌 Kozmik Uyum Raporu' : '🌌 Cosmic Report'}
                onPress={() => router.push({ pathname: '/modules/matching/reveal', params: { matchId: match.id } })}
              />
              <KismetButton
                title={lang === 'tr' ? '💬 Mesaj Gönder' : '💬 Send Message'}
                onPress={() => router.push({ pathname: '/modules/matching/chat', params: { matchId: match.id } })}
                variant="outline"
              />
            </View>
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}
