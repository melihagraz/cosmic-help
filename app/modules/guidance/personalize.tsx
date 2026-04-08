import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import KismetButton from '../../../components/ui/KismetButton';
import Chip from '../../../components/ui/Chip';
import { Colors } from '../../../constants/colors';
import { useProfile } from '../../../hooks/useProfile';
import { supabase } from '../../../services/supabase';
import i18n from '../../../i18n';

export default function PersonalizeScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const lang = i18n.locale as 'tr' | 'en';

  const [answer1, setAnswer1] = useState('');
  const [answer2, setAnswer2] = useState('');
  const [saving, setSaving] = useState(false);

  const focus = profile?.focus || [];

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  // Determine questions based on primary focus
  const primaryFocus = focus[0] || 'growth';

  const questions: Record<string, { q1: string; o1: { key: string; label: string }[]; field1: string; q2?: string; o2?: { key: string; label: string }[]; field2?: string }> = {
    career: {
      q1: lang === 'tr' ? 'Hangi alanda çalışıyorsun?' : 'What field do you work in?',
      o1: [
        { key: 'tech', label: lang === 'tr' ? '💻 Teknoloji' : '💻 Tech' },
        { key: 'health', label: lang === 'tr' ? '🏥 Sağlık' : '🏥 Healthcare' },
        { key: 'finance', label: lang === 'tr' ? '💰 Finans' : '💰 Finance' },
        { key: 'education', label: lang === 'tr' ? '📚 Eğitim' : '📚 Education' },
        { key: 'creative', label: lang === 'tr' ? '🎨 Yaratıcı' : '🎨 Creative' },
        { key: 'service', label: lang === 'tr' ? '🤝 Hizmet' : '🤝 Service' },
      ],
      field1: 'career_field',
      q2: lang === 'tr' ? 'Kariyer hedefin ne?' : 'What is your career goal?',
      o2: [
        { key: 'promotion', label: lang === 'tr' ? '📈 Terfi' : '📈 Promotion' },
        { key: 'job_change', label: lang === 'tr' ? '🔄 İş değişikliği' : '🔄 Job change' },
        { key: 'start_business', label: lang === 'tr' ? '🚀 Kendi işim' : '🚀 Start business' },
        { key: 'skill_up', label: lang === 'tr' ? '📖 Yeni beceri' : '📖 Skill up' },
      ],
      field2: 'career_goal',
    },
    health: {
      q1: lang === 'tr' ? 'Sağlıkta neye odaklanıyorsun?' : 'What health area are you focused on?',
      o1: [
        { key: 'fitness', label: lang === 'tr' ? '💪 Fitness' : '💪 Fitness' },
        { key: 'mental', label: lang === 'tr' ? '🧠 Mental sağlık' : '🧠 Mental health' },
        { key: 'nutrition', label: lang === 'tr' ? '🥗 Beslenme' : '🥗 Nutrition' },
        { key: 'sleep', label: lang === 'tr' ? '😴 Uyku' : '😴 Sleep' },
      ],
      field1: 'health_focus',
    },
    money: {
      q1: lang === 'tr' ? 'Finansal hedefin ne?' : 'What is your financial goal?',
      o1: [
        { key: 'save', label: lang === 'tr' ? '🏦 Tasarruf' : '🏦 Save' },
        { key: 'invest', label: lang === 'tr' ? '📊 Yatırım' : '📊 Invest' },
        { key: 'debt_free', label: lang === 'tr' ? '🆓 Borçtan kurtul' : '🆓 Debt free' },
        { key: 'income', label: lang === 'tr' ? '💵 Gelir artır' : '💵 Increase income' },
      ],
      field1: 'finance_goal',
    },
    love: {
      q1: lang === 'tr' ? 'İlişkinde neye odaklanmak istiyorsun?' : 'What do you want to focus on in your relationship?',
      o1: [
        { key: 'improve', label: lang === 'tr' ? '💬 İletişimi güçlendir' : '💬 Improve communication' },
        { key: 'deepen', label: lang === 'tr' ? '💕 Bağı derinleştir' : '💕 Deepen bond' },
        { key: 'resolve', label: lang === 'tr' ? '🕊️ Sorunları çöz' : '🕊️ Resolve conflicts' },
      ],
      field1: 'relationship_goal',
    },
    family: {
      q1: lang === 'tr' ? 'Ailende neye odaklanıyorsun?' : 'What family area are you focused on?',
      o1: [
        { key: 'improve', label: lang === 'tr' ? '💬 İletişim' : '💬 Communication' },
        { key: 'deepen', label: lang === 'tr' ? '💕 Bağ güçlendirme' : '💕 Strengthen bonds' },
        { key: 'resolve', label: lang === 'tr' ? '🕊️ Sorun çözme' : '🕊️ Problem solving' },
      ],
      field1: 'relationship_goal',
    },
    growth: {
      q1: lang === 'tr' ? 'Kişisel gelişimde neye odaklanıyorsun?' : 'What personal growth area?',
      o1: [
        { key: 'skill_up', label: lang === 'tr' ? '📖 Yeni beceriler' : '📖 New skills' },
        { key: 'mental', label: lang === 'tr' ? '🧠 Zihinsel gelişim' : '🧠 Mental growth' },
        { key: 'fitness', label: lang === 'tr' ? '💪 Fiziksel gelişim' : '💪 Physical growth' },
        { key: 'improve', label: lang === 'tr' ? '💬 Sosyal beceriler' : '💬 Social skills' },
      ],
      field1: 'career_goal',
    },
  };

  const q = questions[primaryFocus] || questions.growth;

  const handleSave = async () => {
    if (!answer1) return;
    setSaving(true);

    // Save to Supabase
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const updates: Record<string, string> = { [q.field1]: answer1 };
      if (q.field2 && answer2) updates[q.field2] = answer2;

      await supabase.from('profiles').update(updates).eq('id', session.user.id);
    }

    setSaving(false);
    router.back();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.deep }} contentContainerStyle={{ padding: 20, paddingTop: 60, alignItems: 'center', paddingBottom: 100 }}>
      <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center', maxWidth: 380 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ alignSelf: 'flex-start', marginBottom: 16 }}>
          <Text style={{ color: Colors.gold, fontSize: 15, fontFamily: 'PlayfairDisplay_600SemiBold' }}>
            {i18n.t('common.back')}
          </Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 48, marginBottom: 12 }}>✨</Text>
        <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: Colors.star, marginBottom: 4, textAlign: 'center' }}>
          {lang === 'tr' ? 'Seni Daha İyi Tanıyalım' : "Let's Know You Better"}
        </Text>
        <Text style={{ fontFamily: 'PlayfairDisplay_400Regular', fontSize: 13, color: Colors.gray, textAlign: 'center', marginBottom: 28 }}>
          {lang === 'tr' ? 'Daha kişisel öneriler için birkaç soru' : 'A few questions for more personal guidance'}
        </Text>

        {/* Question 1 */}
        <View style={sectionStyle}>
          <Text style={sectionTitle}>{q.q1}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {q.o1.map(opt => (
              <Chip key={opt.key} label={opt.label} selected={answer1 === opt.key} onPress={() => setAnswer1(opt.key)} />
            ))}
          </View>
        </View>

        {/* Question 2 (optional) */}
        {q.q2 && q.o2 && (
          <View style={sectionStyle}>
            <Text style={sectionTitle}>{q.q2}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {q.o2.map(opt => (
                <Chip key={opt.key} label={opt.label} selected={answer2 === opt.key} onPress={() => setAnswer2(opt.key)} />
              ))}
            </View>
          </View>
        )}

        <View style={{ marginTop: 12, width: '100%' }}>
          <KismetButton
            title={saving ? '...' : (lang === 'tr' ? 'Kaydet ✦' : 'Save ✦')}
            onPress={handleSave}
            disabled={!answer1 || saving}
          />
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const sectionStyle = {
  width: '100%' as const,
  backgroundColor: 'rgba(255,255,255,0.03)' as const,
  borderWidth: 1,
  borderColor: 'rgba(212,165,116,0.1)' as const,
  borderRadius: 16,
  padding: 16,
  marginBottom: 16,
};

const sectionTitle = {
  fontFamily: 'PlayfairDisplay_600SemiBold' as const,
  fontSize: 15,
  color: '#d4a574' as const,
  textAlign: 'center' as const,
  marginBottom: 12,
};
