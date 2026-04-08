import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import KismetButton from '../../components/ui/KismetButton';
import ProgressDots from '../../components/ui/ProgressDots';
import { Colors } from '../../constants/colors';
import { getZodiacSign } from '../../constants/zodiac';
import i18n from '../../i18n';

export default function BirthDateScreen() {
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name: string }>();
  const [day, setDay] = useState(15);
  const [month, setMonth] = useState(6);
  const [year, setYear] = useState(1995);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const zodiac = getZodiacSign(day, month);
  const lang = i18n.locale as 'tr' | 'en';
  const monthNames = lang === 'tr'
    ? ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
    : ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: 80 }, (_, i) => 2012 - i); // 2012 -> 1933

  const ITEM_HEIGHT = 40;
  const ScrollPicker = ({ items, selected, onSelect, renderItem }: any) => {
    const scrollRef = useRef<ScrollView>(null);
    const selectedIndex = items.findIndex((item: any) => item.value === selected);

    useEffect(() => {
      if (scrollRef.current && selectedIndex >= 0) {
        setTimeout(() => {
          scrollRef.current?.scrollTo({ y: Math.max(0, selectedIndex * ITEM_HEIGHT - 55), animated: false });
        }, 100);
      }
    }, [selectedIndex]);

    return (
      <ScrollView
        ref={scrollRef}
        style={{ height: 150, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212,165,116,0.15)', backgroundColor: 'rgba(255,255,255,0.03)' }}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item: any, idx: number) => {
          const isSelected = item.value === selected;
          return (
            <TouchableOpacity
              key={idx}
              onPress={() => onSelect(item.value)}
              style={{
                height: ITEM_HEIGHT,
                justifyContent: 'center',
                paddingHorizontal: 16,
                backgroundColor: isSelected ? 'rgba(212,165,116,0.15)' : 'transparent',
                borderLeftWidth: isSelected ? 3 : 0,
                borderLeftColor: Colors.gold,
              }}
            >
              <Text style={{
                fontFamily: isSelected ? 'PlayfairDisplay_700Bold' : 'PlayfairDisplay_400Regular',
                fontSize: 15,
                color: isSelected ? Colors.gold : Colors.star,
                textAlign: 'center',
              }}>
                {renderItem ? renderItem(item) : item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <Animated.View style={{ flex: 1, padding: 24, paddingTop: 60, opacity: fadeAnim }}>
      <ProgressDots step={1} total={6} />
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>🎂</Text>
        <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, color: Colors.star, textAlign: 'center', marginBottom: 20 }}>
          {i18n.t('onboarding.birthQ')}
        </Text>

        <View style={{ flexDirection: 'row', gap: 10, width: '100%', maxWidth: 360, marginBottom: 20 }}>
          {/* Day */}
          <View style={{ flex: 1 }}>
            <Text style={{ color: Colors.gold, fontSize: 12, fontFamily: 'PlayfairDisplay_600SemiBold', marginBottom: 6, textAlign: 'center' }}>
              {i18n.t('onboarding.day')}
            </Text>
            <ScrollPicker
              items={days.map(d => ({ value: d, label: String(d) }))}
              selected={day}
              onSelect={setDay}
            />
          </View>

          {/* Month */}
          <View style={{ flex: 1.5 }}>
            <Text style={{ color: Colors.gold, fontSize: 12, fontFamily: 'PlayfairDisplay_600SemiBold', marginBottom: 6, textAlign: 'center' }}>
              {i18n.t('onboarding.month')}
            </Text>
            <ScrollPicker
              items={monthNames.map((m, i) => ({ value: i + 1, label: m }))}
              selected={month}
              onSelect={setMonth}
            />
          </View>

          {/* Year */}
          <View style={{ flex: 1 }}>
            <Text style={{ color: Colors.gold, fontSize: 12, fontFamily: 'PlayfairDisplay_600SemiBold', marginBottom: 6, textAlign: 'center' }}>
              {i18n.t('onboarding.year')}
            </Text>
            <ScrollPicker
              items={years.map(y => ({ value: y, label: String(y) }))}
              selected={year}
              onSelect={setYear}
            />
          </View>
        </View>

        {/* Zodiac result */}
        <View style={{ backgroundColor: 'rgba(212,165,116,0.1)', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <Text style={{ fontSize: 36 }}>{zodiac.symbol}</Text>
          <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 18, color: Colors.star }}>
            {i18n.t('onboarding.youAre')} {zodiac[lang]}!
          </Text>
        </View>

        <KismetButton
          title={i18n.t('onboarding.next')}
          onPress={() => router.push({ pathname: '/onboarding/birthplace', params: { name, day: String(day), month: String(month), year: String(year) } })}
        />
      </View>
    </Animated.View>
  );
}