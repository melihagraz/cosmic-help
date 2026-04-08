import React from 'react';
import { View, Text, Image } from 'react-native';
import { Colors } from '../../constants/colors';
import { MatchingProfile, getAge } from '../../services/matching';
import { ZODIAC_SIGNS } from '../../constants/birthchart';
import i18n from '../../i18n';

interface MatchCardProps {
  profile: MatchingProfile;
  compatibilityScore: number;
  isMutual: boolean;
  blurred?: boolean;
}

export default function MatchCard({ profile, compatibilityScore, isMutual, blurred = false }: MatchCardProps) {
  const lang = i18n.locale as 'tr' | 'en';
  const zodiacInfo = ZODIAC_SIGNS.find(z => z.key === profile.zodiac_sign);
  const age = getAge(profile.birth_year);
  const scorePercent = Math.round(compatibilityScore * 100);

  return (
    <View style={{
      backgroundColor: 'rgba(45,27,78,0.4)',
      borderWidth: 1,
      borderColor: isMutual ? 'rgba(212,165,116,0.4)' : 'rgba(212,165,116,0.15)',
      borderRadius: 24,
      padding: 24,
      alignItems: 'center',
      width: '100%',
    }}>
      {/* Photo or Zodiac symbol */}
      {!blurred && profile.photo_url ? (
        <Image source={{ uri: profile.photo_url }} style={{
          width: 80, height: 80, borderRadius: 40,
          borderWidth: 2, borderColor: 'rgba(212,165,116,0.4)',
          marginBottom: 16,
        }} />
      ) : (
        <View style={{
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: 'rgba(212,165,116,0.1)',
          borderWidth: 2, borderColor: 'rgba(212,165,116,0.3)',
          alignItems: 'center', justifyContent: 'center', marginBottom: 16,
        }}>
          <Text style={{ fontSize: 40 }}>{zodiacInfo?.symbol || '✦'}</Text>
        </View>
      )}

      {/* Compatibility score */}
      <View style={{
        backgroundColor: scorePercent >= 80 ? 'rgba(76,175,80,0.15)' : scorePercent >= 60 ? 'rgba(212,165,116,0.15)' : 'rgba(255,69,0,0.1)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 6,
        marginBottom: 12,
      }}>
        <Text style={{
          fontFamily: 'PlayfairDisplay_700Bold',
          fontSize: 16,
          color: scorePercent >= 80 ? '#4CAF50' : scorePercent >= 60 ? Colors.gold : '#FF6347',
        }}>
          {lang === 'tr' ? `%${scorePercent} Uyum` : `${scorePercent}% Compatible`}
        </Text>
      </View>

      {/* Name & age */}
      {blurred ? (
        <>
          <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: Colors.star, marginBottom: 4, opacity: 0.3 }}>
            {'● ● ● ● ●'}
          </Text>
          <Text style={{ fontFamily: 'PlayfairDisplay_400Regular', fontSize: 13, color: Colors.gray }}>
            {zodiacInfo?.[lang] || ''} • {lang === 'tr' ? `${age} yaş` : `Age ${age}`}
          </Text>
          <Text style={{ fontFamily: 'PlayfairDisplay_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 12, textAlign: 'center' }}>
            {lang === 'tr' ? '💫 Beğenip eşleşirseniz profil açılır' : '💫 Like each other to reveal the profile'}
          </Text>
        </>
      ) : (
        <>
          <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: Colors.star, marginBottom: 4 }}>
            {profile.name}
          </Text>
          <Text style={{ fontFamily: 'PlayfairDisplay_400Regular', fontSize: 13, color: Colors.gray }}>
            {zodiacInfo?.[lang] || ''} • {lang === 'tr' ? `${age} yaş` : `Age ${age}`} • {profile.city}
          </Text>
          {profile.bio ? (
            <Text style={{ fontFamily: 'PlayfairDisplay_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 12, textAlign: 'center', lineHeight: 20 }}>
              "{profile.bio}"
            </Text>
          ) : null}
        </>
      )}

      {/* Mutual badge */}
      {isMutual && (
        <View style={{
          marginTop: 16,
          backgroundColor: 'rgba(212,165,116,0.15)',
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        }}>
          <Text style={{ fontSize: 16 }}>✨</Text>
          <Text style={{ fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 13, color: Colors.gold }}>
            {lang === 'tr' ? 'Karşılıklı Beğeni!' : 'Mutual Match!'}
          </Text>
        </View>
      )}
    </View>
  );
}
