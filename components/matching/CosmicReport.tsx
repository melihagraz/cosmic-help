import React from 'react';
import { View, Text } from 'react-native';
import { Colors } from '../../constants/colors';
import TypingText from '../ui/TypingText';
import i18n from '../../i18n';

interface CosmicReportProps {
  report: string;
  score: number;
}

export default function CosmicReport({ report, score }: CosmicReportProps) {
  const lang = i18n.locale as 'tr' | 'en';
  const scorePercent = Math.round(score * 100);

  return (
    <View style={{ width: '100%' }}>
      {/* Header */}
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: 32, marginBottom: 8 }}>🌌</Text>
        <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 18, color: Colors.gold, letterSpacing: 1 }}>
          {lang === 'tr' ? 'Kozmik Uyum Raporu' : 'Cosmic Compatibility Report'}
        </Text>
        <Text style={{ fontFamily: 'PlayfairDisplay_400Regular', fontSize: 13, color: Colors.gray, marginTop: 4 }}>
          {lang === 'tr' ? `Genel uyum: %${scorePercent}` : `Overall compatibility: ${scorePercent}%`}
        </Text>
      </View>

      {/* Report body */}
      <View style={{
        backgroundColor: 'rgba(212,165,116,0.07)',
        borderWidth: 1,
        borderColor: 'rgba(212,165,116,0.18)',
        borderRadius: 20,
        padding: 20,
      }}>
        <TypingText
          text={report}
          speed={10}
          style={{
            color: 'rgba(255,255,255,0.85)',
            lineHeight: 24,
            fontSize: 14,
            fontFamily: 'PlayfairDisplay_400Regular',
          }}
        />
      </View>
    </View>
  );
}
