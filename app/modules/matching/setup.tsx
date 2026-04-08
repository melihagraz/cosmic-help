import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import KismetButton from '../../../components/ui/KismetButton';
import Chip from '../../../components/ui/Chip';
import { Colors } from '../../../constants/colors';
import { getZodiacSign } from '../../../constants/zodiac';
import { useProfile } from '../../../hooks/useProfile';
import { useAuth } from '../../../contexts/AuthContext';
import { upsertMatchingProfile } from '../../../services/matching';
import { supabase } from '../../../services/supabase';
import i18n from '../../../i18n';

export default function MatchingSetup() {
  const router = useRouter();
  const { profile } = useProfile();
  const { user } = useAuth();
  const lang = i18n.locale as 'tr' | 'en';
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [genderPref, setGenderPref] = useState<string>('');
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(40);
  const [bio, setBio] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoUri || !user) return null;
    try {
      const response = await fetch(photoUri);
      const blob = await response.blob();
      const fileName = `${user.id}.jpg`;
      const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { upsert: true, contentType: 'image/jpeg' });
      if (error) { console.error('Upload error:', error); return null; }
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (e) { console.error('Photo upload error:', e); return null; }
  };

  const handleSave = async () => {
    if (!genderPref || !profile || !user) return;
    setSaving(true);

    // Upload photo if selected
    let photoUrl: string | null = null;
    if (photoUri) {
      photoUrl = await uploadPhoto();
    }

    const zodiac = getZodiacSign(profile.birthDay, profile.birthMonth);

    const result = await upsertMatchingProfile({
      name: profile.name,
      birth_day: profile.birthDay,
      birth_month: profile.birthMonth,
      birth_year: profile.birthYear,
      zodiac_sign: zodiac.key,
      city: profile.city || '',
      gender: profile.gender,
      gender_preference: genderPref,
      age_range_min: ageMin,
      age_range_max: ageMax,
      focus: profile.focus,
      interests: profile.interests,
      bio: bio.trim(),
      photo_url: photoUrl,
      is_active: true,
    });

    setSaving(false);

    if (result.success) {
      router.replace('/modules/matching');
    } else {
      console.error('Profile save error:', result.error);
    }
  };

  const genderOptions = [
    { key: 'female', label: lang === 'tr' ? '♀ Kadın' : '♀ Women', value: 'female' },
    { key: 'male', label: lang === 'tr' ? '♂ Erkek' : '♂ Men', value: 'male' },
    { key: 'everyone', label: lang === 'tr' ? '✦ Herkes' : '✦ Everyone', value: 'everyone' },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.deep }} contentContainerStyle={{ padding: 20, paddingTop: 60, alignItems: 'center', paddingBottom: 100 }}>
      <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center', maxWidth: 380 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ alignSelf: 'flex-start', marginBottom: 16 }}>
          <Text style={{ color: Colors.gold, fontSize: 15, fontFamily: 'PlayfairDisplay_600SemiBold' }}>
            {i18n.t('common.back')}
          </Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 48, marginBottom: 12 }}>💫</Text>
        <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: Colors.star, marginBottom: 4 }}>
          {lang === 'tr' ? 'Eşleşme Profili' : 'Match Profile'}
        </Text>
        <Text style={{ fontFamily: 'PlayfairDisplay_400Regular', fontSize: 13, color: Colors.gray, textAlign: 'center', marginBottom: 28 }}>
          {lang === 'tr' ? 'Yıldızların seni kiminle eşleştireceğini belirleyelim' : "Let's determine who the stars will match you with"}
        </Text>

        {/* Gender preference */}
        <View style={sectionStyle}>
          <Text style={sectionTitle}>
            {lang === 'tr' ? 'Kimi arıyorsun?' : 'Who are you looking for?'}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {genderOptions.map(opt => (
              <Chip
                key={opt.key}
                label={opt.label}
                selected={genderPref === opt.value}
                onPress={() => setGenderPref(opt.value)}
              />
            ))}
          </View>
        </View>

        {/* Age range */}
        <View style={sectionStyle}>
          <Text style={sectionTitle}>
            {lang === 'tr' ? 'Yaş aralığı' : 'Age range'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TouchableOpacity onPress={() => setAgeMin(Math.max(18, ageMin - 1))} style={stepBtn}>
                  <Text style={stepBtnText}>−</Text>
                </TouchableOpacity>
                <View style={ageBox}>
                  <Text style={ageText}>{ageMin}</Text>
                </View>
                <TouchableOpacity onPress={() => setAgeMin(Math.min(ageMax - 1, ageMin + 1))} style={stepBtn}>
                  <Text style={stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ color: Colors.gray, fontSize: 10, marginTop: 4 }}>Min</Text>
            </View>

            <Text style={{ color: Colors.gold, fontSize: 18, fontWeight: 'bold' }}>–</Text>

            <View style={{ alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TouchableOpacity onPress={() => setAgeMax(Math.max(ageMin + 1, ageMax - 1))} style={stepBtn}>
                  <Text style={stepBtnText}>−</Text>
                </TouchableOpacity>
                <View style={ageBox}>
                  <Text style={ageText}>{ageMax}</Text>
                </View>
                <TouchableOpacity onPress={() => setAgeMax(Math.min(80, ageMax + 1))} style={stepBtn}>
                  <Text style={stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ color: Colors.gray, fontSize: 10, marginTop: 4 }}>Max</Text>
            </View>
          </View>
        </View>

        {/* Photo */}
        <View style={sectionStyle}>
          <Text style={sectionTitle}>
            {lang === 'tr' ? 'Profil fotoğrafı (isteğe bağlı)' : 'Profile photo (optional)'}
          </Text>
          <TouchableOpacity onPress={pickPhoto} style={{ alignItems: 'center' }}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: 'rgba(212,165,116,0.4)' }} />
            ) : (
              <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(212,165,116,0.1)', borderWidth: 2, borderColor: 'rgba(212,165,116,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 32 }}>📷</Text>
              </View>
            )}
            <Text style={{ color: Colors.gold, fontSize: 12, fontFamily: 'PlayfairDisplay_400Regular', marginTop: 8 }}>
              {photoUri ? (lang === 'tr' ? 'Değiştir' : 'Change') : (lang === 'tr' ? 'Fotoğraf Ekle' : 'Add Photo')}
            </Text>
          </TouchableOpacity>
          <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, textAlign: 'center', marginTop: 8 }}>
            {lang === 'tr' ? 'Eşleşme olursa karşı tarafa gösterilir' : 'Shown to your match when you connect'}
          </Text>
        </View>

        {/* Bio */}
        <View style={sectionStyle}>
          <Text style={sectionTitle}>
            {lang === 'tr' ? 'Kısa tanıtım (isteğe bağlı)' : 'Short bio (optional)'}
          </Text>
          <TextInput
            value={bio}
            onChangeText={(t) => setBio(t.slice(0, 200))}
            placeholder={lang === 'tr' ? 'Kendini kısaca tanıt...' : 'Tell a bit about yourself...'}
            placeholderTextColor="rgba(240,230,211,0.3)"
            multiline
            style={{
              width: '100%',
              minHeight: 80,
              padding: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: 'rgba(212,165,116,0.15)',
              backgroundColor: 'rgba(255,255,255,0.04)',
              color: Colors.star,
              fontSize: 14,
              fontFamily: 'PlayfairDisplay_400Regular',
              textAlignVertical: 'top',
            }}
          />
          <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, alignSelf: 'flex-end', marginTop: 4 }}>
            {bio.length}/200
          </Text>
        </View>

        <View style={{ marginTop: 8, width: '100%' }}>
          <KismetButton
            title={saving ? (lang === 'tr' ? 'Kaydediliyor...' : 'Saving...') : (lang === 'tr' ? 'Eşleşmeye Başla ✦' : 'Start Matching ✦')}
            onPress={handleSave}
            disabled={!genderPref || saving}
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

const stepBtn = {
  width: 30,
  height: 30,
  borderRadius: 15,
  backgroundColor: 'rgba(212,165,116,0.1)' as const,
  borderWidth: 1,
  borderColor: 'rgba(212,165,116,0.2)' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const stepBtnText = { color: '#d4a574', fontSize: 16, fontWeight: 'bold' as const };

const ageBox = {
  width: 44,
  height: 38,
  borderRadius: 10,
  backgroundColor: 'rgba(45,27,78,0.5)' as const,
  borderWidth: 1,
  borderColor: 'rgba(212,165,116,0.2)' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const ageText = { fontFamily: 'PlayfairDisplay_700Bold' as const, fontSize: 17, color: '#f0e6d3' };
