import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import KismetButton from '../../../components/ui/KismetButton';
import { Colors } from '../../../constants/colors';
import { useAuth } from '../../../contexts/AuthContext';
import { sendMessage, getMessages, MatchMessage } from '../../../services/matching';
import i18n from '../../../i18n';

export default function MatchChat() {
  const router = useRouter();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<MatchMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [hasSent, setHasSent] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const lang = i18n.locale as 'tr' | 'en';

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    loadMessages();
  }, []);

  const loadMessages = async () => {
    if (!matchId) return;
    const msgs = await getMessages(matchId);
    setMessages(msgs);
    // Check if current user already sent
    if (msgs.some(m => m.sender_id === user?.id)) {
      setHasSent(true);
    }
  };

  const handleSend = async () => {
    if (!matchId || !text.trim() || hasSent) return;
    setSending(true);

    const result = await sendMessage(matchId, text.trim());

    if (result.success) {
      setHasSent(true);
      await loadMessages();
      setText('');
    } else {
      Alert.alert('', result.error || (lang === 'tr' ? 'Gönderilemedi' : 'Failed to send'));
    }

    setSending(false);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.deep }} contentContainerStyle={{ padding: 20, paddingTop: 60, alignItems: 'center', paddingBottom: 100 }}>
      <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center', maxWidth: 380 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ alignSelf: 'flex-start', marginBottom: 16 }}>
          <Text style={{ color: Colors.gold, fontSize: 15, fontFamily: 'PlayfairDisplay_600SemiBold' }}>
            {i18n.t('common.back')}
          </Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 40, marginBottom: 8 }}>💬</Text>
        <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: Colors.star, marginBottom: 4 }}>
          {lang === 'tr' ? 'Kozmik Mesaj' : 'Cosmic Message'}
        </Text>
        <Text style={{ fontFamily: 'PlayfairDisplay_400Regular', fontSize: 12, color: Colors.gray, textAlign: 'center', marginBottom: 24 }}>
          {lang === 'tr'
            ? 'Her eşleşmede 1 mesaj hakkın var. İyi kullan! ✨'
            : 'You have 1 message per match. Make it count! ✨'}
        </Text>

        {/* Messages */}
        {messages.length > 0 && (
          <View style={{ width: '100%', gap: 12, marginBottom: 24 }}>
            {messages.map(msg => {
              const isMe = msg.sender_id === user?.id;
              return (
                <View key={msg.id} style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  backgroundColor: isMe ? 'rgba(212,165,116,0.15)' : 'rgba(255,255,255,0.06)',
                  borderWidth: 1,
                  borderColor: isMe ? 'rgba(212,165,116,0.25)' : 'rgba(255,255,255,0.08)',
                  borderRadius: 16,
                  borderBottomRightRadius: isMe ? 4 : 16,
                  borderBottomLeftRadius: isMe ? 16 : 4,
                  padding: 14,
                }}>
                  <Text style={{ color: Colors.star, fontSize: 14, fontFamily: 'PlayfairDisplay_400Regular', lineHeight: 20 }}>
                    {msg.content}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, marginTop: 6, alignSelf: 'flex-end' }}>
                    {new Date(msg.created_at).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Input or sent state */}
        {hasSent ? (
          <View style={{ alignItems: 'center', marginTop: 12 }}>
            <Text style={{ fontSize: 24, marginBottom: 8 }}>✅</Text>
            <Text style={{ fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 14, color: Colors.gold, marginBottom: 8 }}>
              {lang === 'tr' ? 'Mesajın gönderildi!' : 'Message sent!'}
            </Text>
            <Text style={{ fontFamily: 'PlayfairDisplay_400Regular', fontSize: 12, color: Colors.gray, textAlign: 'center', lineHeight: 18, maxWidth: 280, marginBottom: 20 }}>
              {lang === 'tr'
                ? 'Devam etmek isterseniz sosyal medya hesaplarınızı paylaşabilirsiniz.'
                : 'If you want to continue, you can share your social media accounts.'}
            </Text>
          </View>
        ) : (
          <View style={{ width: '100%' }}>
            <TextInput
              value={text}
              onChangeText={(t) => setText(t.slice(0, 500))}
              placeholder={lang === 'tr' ? 'Kozmik mesajını yaz...' : 'Write your cosmic message...'}
              placeholderTextColor="rgba(240,230,211,0.3)"
              multiline
              style={{
                width: '100%',
                minHeight: 100,
                padding: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(212,165,116,0.2)',
                backgroundColor: 'rgba(255,255,255,0.04)',
                color: Colors.star,
                fontSize: 14,
                fontFamily: 'PlayfairDisplay_400Regular',
                textAlignVertical: 'top',
                lineHeight: 22,
              }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, marginBottom: 16 }}>
              <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>
                {text.length}/500
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>
                {lang === 'tr' ? '1 mesaj hakkı' : '1 message allowed'}
              </Text>
            </View>
            <KismetButton
              title={sending ? (lang === 'tr' ? 'Gönderiliyor...' : 'Sending...') : (lang === 'tr' ? 'Gönder ✦' : 'Send ✦')}
              onPress={handleSend}
              disabled={!text.trim() || sending}
            />
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}
