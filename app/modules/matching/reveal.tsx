import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import CosmicReport from '../../../components/matching/CosmicReport';
import KismetButton from '../../../components/ui/KismetButton';
import { Colors } from '../../../constants/colors';
import { getCompatibilityReport, getWeeklyMatch } from '../../../services/matching';
import i18n from '../../../i18n';

export default function MatchReveal() {
  const router = useRouter();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const [report, setReport] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const lang = i18n.locale as 'tr' | 'en';

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    loadReport();
  }, []);

  const loadReport = async () => {
    if (!matchId) return;
    const reportText = await getCompatibilityReport(matchId);
    const match = await getWeeklyMatch();
    setReport(reportText);
    setScore(match?.compatibility_score || 0);
    setLoading(false);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.deep }} contentContainerStyle={{ padding: 20, paddingTop: 60, alignItems: 'center', paddingBottom: 100 }}>
      <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center', maxWidth: 380 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ alignSelf: 'flex-start', marginBottom: 16 }}>
          <Text style={{ color: Colors.gold, fontSize: 15, fontFamily: 'PlayfairDisplay_600SemiBold' }}>
            {i18n.t('common.back')}
          </Text>
        </TouchableOpacity>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🌌</Text>
            <Text style={{ color: Colors.goldLight, fontSize: 15, fontFamily: 'PlayfairDisplay_600SemiBold' }}>
              {lang === 'tr' ? 'Kozmik rapor hazırlanıyor...' : 'Preparing cosmic report...'}
            </Text>
          </View>
        ) : report ? (
          <CosmicReport report={report} score={score} />
        ) : (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🌠</Text>
            <Text style={{ fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 15, color: Colors.star, textAlign: 'center', marginBottom: 8 }}>
              {lang === 'tr' ? 'Rapor henüz hazır değil' : 'Report not ready yet'}
            </Text>
            <Text style={{ fontFamily: 'PlayfairDisplay_400Regular', fontSize: 13, color: Colors.gray, textAlign: 'center' }}>
              {lang === 'tr' ? 'Kozmik uyum raporun yakında hazır olacak.' : 'Your cosmic compatibility report will be ready soon.'}
            </Text>
          </View>
        )}

        <View style={{ marginTop: 24, width: '100%' }}>
          <KismetButton
            title={lang === 'tr' ? '💬 Mesaj Gönder' : '💬 Send Message'}
            onPress={() => router.push({ pathname: '/modules/matching/chat', params: { matchId: matchId || '' } })}
            variant="outline"
          />
        </View>
      </Animated.View>
    </ScrollView>
  );
}
