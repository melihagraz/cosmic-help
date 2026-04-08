import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Colors } from '../../constants/colors';
import { getNextMondayCountdown } from '../../services/matching';
import i18n from '../../i18n';

export default function CountdownTimer() {
  const [countdown, setCountdown] = useState(getNextMondayCountdown());
  const lang = i18n.locale as 'tr' | 'en';

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getNextMondayCountdown());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ alignItems: 'center', padding: 16 }}>
      <Text style={{ color: Colors.gray, fontSize: 11, fontFamily: 'PlayfairDisplay_400Regular', marginBottom: 8 }}>
        {lang === 'tr' ? 'Yeni eşleşme için' : 'Next match in'}
      </Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TimeUnit value={countdown.days} label={lang === 'tr' ? 'gün' : 'days'} />
        <TimeUnit value={countdown.hours} label={lang === 'tr' ? 'saat' : 'hrs'} />
        <TimeUnit value={countdown.minutes} label={lang === 'tr' ? 'dk' : 'min'} />
      </View>
    </View>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{
        backgroundColor: 'rgba(45,27,78,0.6)',
        borderWidth: 1,
        borderColor: 'rgba(212,165,116,0.2)',
        borderRadius: 12,
        width: 52,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: Colors.gold }}>
          {value}
        </Text>
      </View>
      <Text style={{ color: Colors.gray, fontSize: 10, marginTop: 4, fontFamily: 'PlayfairDisplay_400Regular' }}>
        {label}
      </Text>
    </View>
  );
}
