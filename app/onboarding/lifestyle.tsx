import { View, Text, ScrollView, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { Colors } from '../../constants/colors';
import KismetButton from '../../components/ui/KismetButton';
import ProgressDots from '../../components/ui/ProgressDots';
import Chip from '../../components/ui/Chip';
import i18n from '../../i18n';

export default function LifestyleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [relation, setRelation] = useState('');
  const [focus, setFocus] = useState<string[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const toggleFocus = (f: string) => {
    setFocus(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const relations = [
    { key: 'single', label: i18n.t('onboarding.single') },
    { key: 'relation', label: i18n.t('onboarding.inRelation') },
    { key: 'married', label: i18n.t('onboarding.married') },
    { key: 'complicated', label: i18n.t('onboarding.complicated') },
  ];

  const focusOptions = [
    { key: 'love', label: i18n.t('onboarding.love'), icon: '💕' },
    { key: 'career', label: i18n.t('onboarding.career'), icon: '💼' },
    { key: 'money', label: i18n.t('onboarding.money'), icon: '💰' },
    { key: 'health', label: i18n.t('onboarding.health'), icon: '🏃' },
    { key: 'family', label: i18n.t('onboarding.family'), icon: '👨‍👩‍👧' },
    { key: 'growth', label: i18n.t('onboarding.growth'), icon: '🌱' },
  ];

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 60, alignItems: 'center' }}>
        <ProgressDots step={4} total={6} />

        <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: Colors.star, textAlign: 'center', marginBottom: 16 }}>
          {i18n.t('onboarding.relationQ')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
          {relations.map(r => (
            <Chip key={r.key} label={r.label} selected={relation === r.key} onPress={() => setRelation(r.key)} />
          ))}
        </View>

        <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: Colors.star, textAlign: 'center', marginBottom: 16 }}>
          {i18n.t('onboarding.lifeQ')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
          {focusOptions.map(f => (
            <Chip key={f.key} label={f.label} icon={f.icon} selected={focus.includes(f.key)} onPress={() => toggleFocus(f.key)} />
          ))}
        </View>

        <KismetButton
          title={i18n.t('onboarding.next')}
          onPress={() => router.push({ pathname: '/onboarding/promise', params: { ...params, relation, focus: focus.join(',') } })}
          disabled={!relation || focus.length === 0}
        />
      </ScrollView>
    </Animated.View>
  );
}
