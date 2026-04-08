import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import KismetButton from '../components/ui/KismetButton';
import { Colors } from '../constants/colors';
import { usePremium } from '../hooks/usePremium';
import i18n from '../i18n';

export default function PaywallScreen() {
  const router = useRouter();
  const { offerings, purchase, restore } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [purchasing, setPurchasing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const lang = i18n.locale as 'tr' | 'en';

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const features = lang === 'tr' ? [
    { icon: '☕', text: 'Sınırsız Kahve Falı — AI Vision ile' },
    { icon: '🃏', text: 'Kişiselleştirilmiş Tarot Yorumları' },
    { icon: '🌙', text: 'Derin Rüya Tabiri — Claude AI' },
    { icon: '🖐️', text: 'El & Yüz Analizi — Kamera ile' },
    { icon: '📜', text: 'Okuma Geçmişi & Arşiv' },
    { icon: '🚫', text: 'Reklamsız Deneyim' },
    { icon: '⚡', text: 'Öncelikli AI İşleme' },
  ] : [
    { icon: '☕', text: 'Unlimited Coffee Cup Readings — AI Vision' },
    { icon: '🃏', text: 'Personalized Tarot Interpretations' },
    { icon: '🌙', text: 'Deep Dream Interpretation — Claude AI' },
    { icon: '🖐️', text: 'Palm & Face Analysis — Camera powered' },
    { icon: '📜', text: 'Reading History & Archive' },
    { icon: '🚫', text: 'Ad-free Experience' },
    { icon: '⚡', text: 'Priority AI Processing' },
  ];

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      // RevenueCat offerings'den paket seç
      const pkg = selectedPlan === 'yearly'
        ? offerings?.annual
        : offerings?.monthly;

      if (pkg) {
        const success = await purchase(pkg);
        if (success) router.back();
      } else {
        // Mock mode (web/test) — direkt geri dön
        console.log('Mock purchase — no real offerings available');
        router.back();
      }
    } catch (e) {
      console.error('Purchase failed:', e);
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    const success = await restore();
    if (success) router.back();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.deep }} contentContainerStyle={{ padding: 24, paddingTop: 50, paddingBottom: 40 }}>
      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Close button */}
        <TouchableOpacity onPress={() => router.back()} style={{ alignSelf: 'flex-end', marginBottom: 8 }}>
          <Text style={{ color: Colors.gray, fontSize: 28 }}>✕</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <Text style={{ fontSize: 48, marginBottom: 8 }}>✦</Text>
          <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: Colors.star, textAlign: 'center', marginBottom: 4 }}>
            Cosmic Help Premium
          </Text>
          <Text style={{ fontFamily: 'PlayfairDisplay_400Regular', fontSize: 15, color: Colors.gold, textAlign: 'center' }}>
            {lang === 'tr' ? 'Geleceğin sınırları kaldır' : 'Unlock the full cosmic experience'}
          </Text>
        </View>

        {/* Features */}
        <View style={{ marginBottom: 28 }}>
          {features.map((f, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14, paddingHorizontal: 8 }}>
              <Text style={{ fontSize: 24 }}>{f.icon}</Text>
              <Text style={{ fontFamily: 'PlayfairDisplay_400Regular', fontSize: 15, color: Colors.star, flex: 1, lineHeight: 20 }}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Plan Selection */}
        <View style={{ gap: 12, marginBottom: 28 }}>
          {/* Yearly */}
          <TouchableOpacity
            onPress={() => setSelectedPlan('yearly')}
            activeOpacity={0.8}
            style={{
              borderRadius: 20, padding: 18, borderWidth: 2,
              borderColor: selectedPlan === 'yearly' ? Colors.gold : 'rgba(212,165,116,0.15)',
              backgroundColor: selectedPlan === 'yearly' ? 'rgba(212,165,116,0.1)' : 'rgba(255,255,255,0.02)',
              position: 'relative',
            }}
          >
            {/* Best value badge */}
            <View style={{ position: 'absolute', top: -10, right: 16, backgroundColor: Colors.gold, paddingVertical: 3, paddingHorizontal: 10, borderRadius: 8 }}>
              <Text style={{ color: Colors.deep, fontSize: 10, fontWeight: '800' }}>
                {lang === 'tr' ? 'EN AVANTAJLI' : 'BEST VALUE'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 17, color: Colors.star }}>
                  {lang === 'tr' ? 'Yıllık Plan' : 'Annual Plan'}
                </Text>
                <Text style={{ fontFamily: 'PlayfairDisplay_400Regular', fontSize: 13, color: Colors.gray, marginTop: 2 }}>
                  {lang === 'tr' ? '₺499.99/yıl — ₺41.67/ay' : '$39.99/year — $3.33/mo'}
                </Text>
              </View>
              <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: selectedPlan === 'yearly' ? Colors.gold : Colors.gray, alignItems: 'center', justifyContent: 'center' }}>
                {selectedPlan === 'yearly' && <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.gold }} />}
              </View>
            </View>
            <Text style={{ fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 12, color: Colors.gold, marginTop: 6 }}>
              {lang === 'tr' ? '🎉 %33 tasarruf' : '🎉 Save 33%'}
            </Text>
          </TouchableOpacity>

          {/* Monthly */}
          <TouchableOpacity
            onPress={() => setSelectedPlan('monthly')}
            activeOpacity={0.8}
            style={{
              borderRadius: 20, padding: 18, borderWidth: 2,
              borderColor: selectedPlan === 'monthly' ? Colors.gold : 'rgba(212,165,116,0.15)',
              backgroundColor: selectedPlan === 'monthly' ? 'rgba(212,165,116,0.1)' : 'rgba(255,255,255,0.02)',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 17, color: Colors.star }}>
                  {lang === 'tr' ? 'Aylık Plan' : 'Monthly Plan'}
                </Text>
                <Text style={{ fontFamily: 'PlayfairDisplay_400Regular', fontSize: 13, color: Colors.gray, marginTop: 2 }}>
                  {lang === 'tr' ? '₺49.99/ay' : '$4.99/month'}
                </Text>
              </View>
              <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: selectedPlan === 'monthly' ? Colors.gold : Colors.gray, alignItems: 'center', justifyContent: 'center' }}>
                {selectedPlan === 'monthly' && <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.gold }} />}
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* CTA Button */}
        <KismetButton
          title={purchasing
            ? (lang === 'tr' ? 'İşleniyor...' : 'Processing...')
            : (lang === 'tr' ? "Premium'a Geç ✦" : 'Go Premium ✦')
          }
          onPress={handlePurchase}
          disabled={purchasing}
          style={{ marginBottom: 16 }}
        />

        {/* Restore + Terms */}
        <TouchableOpacity onPress={handleRestore} style={{ alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontFamily: 'PlayfairDisplay_400Regular', fontSize: 13, color: Colors.gold, textDecorationLine: 'underline' }}>
            {lang === 'tr' ? 'Satın alımı geri yükle' : 'Restore purchases'}
          </Text>
        </TouchableOpacity>

        <Text style={{ fontFamily: 'PlayfairDisplay_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', lineHeight: 16 }}>
          {lang === 'tr'
            ? 'Abonelik otomatik olarak yenilenir. İstediğin zaman App Store ayarlarından iptal edebilirsin. Ödeme Apple ID hesabına faturalanır.'
            : 'Subscription auto-renews. Cancel anytime in App Store settings. Payment charged to Apple ID account.'
          }
        </Text>
      </Animated.View>
    </ScrollView>
  );
}
