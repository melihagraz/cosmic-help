import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Badge from '../../../components/ui/Badge';
import KismetButton from '../../../components/ui/KismetButton';
import TypingText from '../../../components/ui/TypingText';
import NatalChartWheel from '../../../components/ui/NatalChart';
import { Colors } from '../../../constants/colors';
import { PLANETS, ZODIAC_SIGNS, HOUSES, getSignFromDegree, formatPosition } from '../../../constants/birthchart';
import { getZodiacSign } from '../../../constants/zodiac';
import { useProfile } from '../../../hooks/useProfile';
import i18n from '../../../i18n';
import { getBirthChartReading } from '../../../services/api';
import { calculateNatalChart, chartToPromptText, NatalChart } from '../../../services/birthchart';

type Phase = 'input' | 'calculating' | 'chart' | 'reading' | 'error';

export default function BirthChartModule() {
  const router = useRouter();
  const { profile } = useProfile();
  const [phase, setPhase] = useState<Phase>('input');
  const [chart, setChart] = useState<NatalChart | null>(null);
  const [reading, setReading] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [calcStep, setCalcStep] = useState(0);
  const [birthHour, setBirthHour] = useState(12);
  const [birthMinute, setBirthMinute] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const lang = i18n.locale as 'tr' | 'en';

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const calculateChart = async () => {
    if (!profile) return;
    setPhase('calculating');

    // Animated calculation steps
    setCalcStep(1);
    await delay(800);
    setCalcStep(2);
    await delay(600);
    setCalcStep(3);
    await delay(500);

    try {
      const result = calculateNatalChart(
        profile.birthYear || 2000,
        profile.birthMonth,
        profile.birthDay,
        birthHour,
        birthMinute,
        profile.city || 'Istanbul'
      );
      setChart(result);
      setPhase('chart');
    } catch (err: any) {
      setErrorMsg(err.message || 'Calculation error');
      setPhase('error');
    }
  };

  const getAIReading = async () => {
    if (!chart || !profile) return;
    setPhase('reading');

    const promptText = chartToPromptText(chart, lang);
    const userProfile = {
      name: profile.name,
      zodiacSign: getZodiacSign(profile.birthDay, profile.birthMonth)[lang],
      gender: profile.gender,
      relation: profile.relation,
      focus: profile.focus,
    };

    const response = await getBirthChartReading(promptText, lang, userProfile);

    if (response.success && response.reading) {
      setReading(response.reading);
    } else {
      setErrorMsg(response.error || (lang === 'tr' ? 'Bir hata oluştu' : 'An error occurred'));
      setPhase('error');
    }
  };

  const reset = () => {
    setPhase('input');
    setChart(null);
    setReading('');
    setErrorMsg('');
    setCalcStep(0);
  };

  const ascSign = chart ? getSignFromDegree(chart.ascendant) : null;
  const mcSign = chart ? getSignFromDegree(chart.midheaven) : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.deep }}
      contentContainerStyle={{ padding: 20, paddingTop: 60, alignItems: 'center', paddingBottom: 100 }}
    >
      <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center' }}>
        {/* Back button */}
        <TouchableOpacity onPress={() => router.back()} style={{ alignSelf: 'flex-start', marginBottom: 16 }}>
          <Text style={{ color: Colors.gold, fontSize: 15, fontFamily: 'PlayfairDisplay_600SemiBold' }}>
            {i18n.t('common.back')}
          </Text>
        </TouchableOpacity>

        {/* ====== INPUT PHASE ====== */}
        {phase === 'input' && (
          <View style={{ alignItems: 'center', width: '100%', maxWidth: 380 }}>
            <Text style={{ fontSize: 56, marginBottom: 12 }}>🪐</Text>
            <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: Colors.star, marginBottom: 4 }}>
              {i18n.t('common.birthchartTitle')}
            </Text>
            <Badge type="premium" />

            {/* Birth data summary */}
            {profile && (
              <View style={cardStyle}>
                <Text style={labelStyle}>
                  {lang === 'tr' ? 'Doğum Bilgilerin' : 'Your Birth Data'}
                </Text>
                <View style={rowStyle}>
                  <Text style={{ fontSize: 28 }}>
                    {getZodiacSign(profile.birthDay, profile.birthMonth).symbol}
                  </Text>
                  <View>
                    <Text style={valueStyle}>
                      {profile.birthDay}/{profile.birthMonth}/{profile.birthYear || '—'}
                    </Text>
                    <Text style={subStyle}>{profile.city || 'Istanbul'}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Birth time picker */}
            <View style={cardStyle}>
              <Text style={labelStyle}>{i18n.t('common.birthTime')}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'PlayfairDisplay_400Regular', textAlign: 'center', marginBottom: 12 }}>
                {i18n.t('common.birthTimeHint')}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {/* Hour picker */}
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: Colors.gray, fontSize: 10, marginBottom: 4 }}>{i18n.t('common.hour')}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <TouchableOpacity onPress={() => setBirthHour(h => Math.max(0, h - 1))} style={stepBtn}>
                      <Text style={stepBtnText}>−</Text>
                    </TouchableOpacity>
                    <View style={timeBox}>
                      <Text style={timeText}>{birthHour.toString().padStart(2, '0')}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setBirthHour(h => Math.min(23, h + 1))} style={stepBtn}>
                      <Text style={stepBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={{ color: Colors.gold, fontSize: 24, fontWeight: 'bold', marginTop: 14 }}>:</Text>

                {/* Minute picker */}
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: Colors.gray, fontSize: 10, marginBottom: 4 }}>{i18n.t('common.minute')}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <TouchableOpacity onPress={() => setBirthMinute(m => Math.max(0, m - 5))} style={stepBtn}>
                      <Text style={stepBtnText}>−</Text>
                    </TouchableOpacity>
                    <View style={timeBox}>
                      <Text style={timeText}>{birthMinute.toString().padStart(2, '0')}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setBirthMinute(m => Math.min(55, m + 5))} style={stepBtn}>
                      <Text style={stepBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 8, marginBottom: 20, textAlign: 'center' }}>
              {lang === 'tr'
                ? '✨ Gerçek astronomik hesaplama + AI yorumu'
                : '✨ Real astronomical calculation + AI interpretation'}
            </Text>

            <KismetButton
              title={lang === 'tr' ? 'Haritamı Hesapla' : 'Calculate My Chart'}
              onPress={calculateChart}
            />
          </View>
        )}

        {/* ====== CALCULATING PHASE ====== */}
        {phase === 'calculating' && (
          <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
            <Text style={{ fontSize: 56, marginBottom: 20 }}>🪐</Text>
            <Text style={{ color: Colors.goldLight, fontSize: 16, fontFamily: 'PlayfairDisplay_600SemiBold', marginBottom: 16 }}>
              {i18n.t('common.calculating')}
            </Text>

            {[
              i18n.t('common.calculatingPlanets'),
              i18n.t('common.calculatingHouses'),
              i18n.t('common.calculatingAspects'),
            ].map((step, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Text style={{ color: calcStep > idx ? Colors.gold : 'rgba(255,255,255,0.2)', fontSize: 14 }}>
                  {calcStep > idx ? '✓' : '○'}
                </Text>
                <Text style={{
                  color: calcStep > idx ? Colors.star : 'rgba(255,255,255,0.3)',
                  fontSize: 13,
                  fontFamily: 'PlayfairDisplay_400Regular',
                }}>
                  {step}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ====== CHART PHASE ====== */}
        {phase === 'chart' && chart && (
          <View style={{ alignItems: 'center', width: '100%', maxWidth: 400 }}>
            <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 18, color: Colors.star, marginBottom: 4 }}>
              {i18n.t('common.yourChart')}
            </Text>
            <Text style={{ fontFamily: 'PlayfairDisplay_400Regular', fontSize: 12, color: Colors.gray, marginBottom: 8 }}>
              {profile?.name} • {profile?.birthDay}/{profile?.birthMonth}/{profile?.birthYear}
              {` • ${birthHour.toString().padStart(2, '0')}:${birthMinute.toString().padStart(2, '0')}`}
            </Text>

            {/* Chart wheel */}
            <NatalChartWheel chart={chart} lang={lang} />

            {/* Key info cards */}
            <View style={{ width: '100%', gap: 8, marginTop: 8 }}>
              {/* Ascendant & Midheaven */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={[infoCard, { flex: 1 }]}>
                  <Text style={infoLabel}>{i18n.t('common.ascendant')}</Text>
                  <Text style={infoValue}>{ascSign?.symbol} {ascSign?.[lang]}</Text>
                </View>
                <View style={[infoCard, { flex: 1 }]}>
                  <Text style={infoLabel}>{i18n.t('common.midheaven')}</Text>
                  <Text style={infoValue}>{mcSign?.symbol} {mcSign?.[lang]}</Text>
                </View>
              </View>

              {/* Planet details */}
              <View style={infoCard}>
                <Text style={infoLabel}>{i18n.t('common.planets')}</Text>
                {chart.planets.map(p => {
                  const info = PLANETS.find(pl => pl.key === p.planet);
                  if (!info) return null;
                  return (
                    <View key={p.planet} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                      <Text style={{ color: info.color, fontSize: 13 }}>
                        {info.symbol} {info[lang]}
                      </Text>
                      <Text style={{ color: Colors.star, fontSize: 12, fontFamily: 'PlayfairDisplay_400Regular' }}>
                        {formatPosition(p.longitude, lang)}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Aspects */}
              {chart.aspects.length > 0 && (
                <View style={infoCard}>
                  <Text style={infoLabel}>{i18n.t('common.aspects')}</Text>
                  {chart.aspects.slice(0, 8).map((a, i) => {
                    const p1 = PLANETS.find(p => p.key === a.planet1);
                    const p2 = PLANETS.find(p => p.key === a.planet2);
                    if (!p1 || !p2) return null;
                    return (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 3 }}>
                        <Text style={{ color: a.aspect.color, fontSize: 12 }}>{a.aspect.symbol}</Text>
                        <Text style={{ color: Colors.star, fontSize: 11, fontFamily: 'PlayfairDisplay_400Regular' }}>
                          {p1[lang]} {a.aspect[lang]} {p2[lang]}
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>({a.orb}°)</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* AI Reading button */}
            <View style={{ marginTop: 20, width: '100%' }}>
              <KismetButton
                title={i18n.t('common.getReading')}
                onPress={getAIReading}
              />
            </View>
          </View>
        )}

        {/* ====== READING PHASE (AI result) ====== */}
        {phase === 'reading' && (
          <View style={{ alignItems: 'center', width: '100%', maxWidth: 380 }}>
            {!reading ? (
              // Loading
              <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
                <Text style={{ fontSize: 56, marginBottom: 16 }}>🔮</Text>
                <Text style={{ color: Colors.goldLight, fontSize: 16, fontFamily: 'PlayfairDisplay_600SemiBold', marginBottom: 8 }}>
                  {lang === 'tr' ? 'Harita yorumlanıyor...' : 'Interpreting your chart...'}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                  {lang === 'tr' ? 'Claude AI analiz ediyor...' : 'Claude AI analyzing...'}
                </Text>
              </View>
            ) : (
              // Result
              <>
                <Text style={{ fontSize: 48, marginBottom: 8 }}>🔮</Text>
                <Text style={{ color: Colors.gold, fontSize: 13, fontFamily: 'PlayfairDisplay_700Bold', letterSpacing: 2, marginBottom: 16 }}>
                  {i18n.t('common.chartReading')}
                </Text>
                <View style={{
                  backgroundColor: 'rgba(212,165,116,0.07)',
                  borderWidth: 1,
                  borderColor: 'rgba(212,165,116,0.18)',
                  borderRadius: 20,
                  padding: 20,
                  width: '100%',
                  marginBottom: 16,
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

                {/* Show chart button */}
                <TouchableOpacity
                  onPress={() => setPhase('chart')}
                  style={{ marginBottom: 12 }}
                >
                  <Text style={{ color: Colors.gold, fontSize: 13, fontFamily: 'PlayfairDisplay_600SemiBold' }}>
                    {lang === 'tr' ? '← Haritayı Gör' : '← View Chart'}
                  </Text>
                </TouchableOpacity>

                <KismetButton
                  title={i18n.t('common.newReading')}
                  onPress={reset}
                  variant="outline"
                />
              </>
            )}
          </View>
        )}

        {/* ====== ERROR PHASE ====== */}
        {phase === 'error' && (
          <View style={{ alignItems: 'center', maxWidth: 380 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>⚠️</Text>
            <Text style={{ color: Colors.star, fontSize: 16, fontFamily: 'PlayfairDisplay_600SemiBold', marginBottom: 8, textAlign: 'center' }}>
              {lang === 'tr' ? 'Bir Hata Oluştu' : 'An Error Occurred'}
            </Text>
            <Text style={{ color: Colors.gray, fontSize: 13, textAlign: 'center', marginBottom: 24 }}>{errorMsg}</Text>
            <KismetButton title={lang === 'tr' ? 'Tekrar Dene' : 'Try Again'} onPress={reset} />
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

// Helper
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Shared styles
const cardStyle = {
  backgroundColor: 'rgba(255,255,255,0.04)' as const,
  borderWidth: 1,
  borderColor: 'rgba(212,165,116,0.15)' as const,
  borderRadius: 16,
  padding: 16,
  width: '100%' as const,
  marginTop: 16,
} as const;

const rowStyle = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 12,
  marginTop: 8,
};

const labelStyle = {
  fontFamily: 'PlayfairDisplay_600SemiBold' as const,
  fontSize: 14,
  color: '#d4a574',
  textAlign: 'center' as const,
  marginBottom: 4,
};

const valueStyle = {
  fontFamily: 'PlayfairDisplay_600SemiBold' as const,
  fontSize: 16,
  color: '#f0e6d3',
};

const subStyle = {
  fontFamily: 'PlayfairDisplay_400Regular' as const,
  fontSize: 12,
  color: 'rgba(255,255,255,0.5)',
};

const stepBtn = {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: 'rgba(212,165,116,0.1)',
  borderWidth: 1,
  borderColor: 'rgba(212,165,116,0.2)',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const stepBtnText = {
  color: '#d4a574',
  fontSize: 18,
  fontWeight: 'bold' as const,
};

const timeBox = {
  width: 48,
  height: 40,
  borderRadius: 10,
  backgroundColor: 'rgba(45,27,78,0.5)',
  borderWidth: 1,
  borderColor: 'rgba(212,165,116,0.2)',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const timeText = {
  fontFamily: 'PlayfairDisplay_700Bold' as const,
  fontSize: 18,
  color: '#f0e6d3',
};

const infoCard = {
  backgroundColor: 'rgba(255,255,255,0.03)' as const,
  borderWidth: 1,
  borderColor: 'rgba(212,165,116,0.1)' as const,
  borderRadius: 14,
  padding: 14,
};

const infoLabel = {
  fontFamily: 'PlayfairDisplay_600SemiBold' as const,
  fontSize: 13,
  color: '#d4a574',
  marginBottom: 8,
};

const infoValue = {
  fontFamily: 'PlayfairDisplay_700Bold' as const,
  fontSize: 18,
  color: '#f0e6d3',
  textAlign: 'center' as const,
};
