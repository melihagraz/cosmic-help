// Birth Chart Constants - Bilingual (TR/EN)

export interface PlanetInfo {
  key: string;
  symbol: string;
  glyph: string;
  tr: string;
  en: string;
  color: string;
}

export interface ZodiacSignInfo {
  key: string;
  symbol: string;
  tr: string;
  en: string;
  element: 'fire' | 'earth' | 'air' | 'water';
  elementColor: string;
  startDegree: number; // 0-360
}

export interface HouseInfo {
  number: number;
  tr: string;
  en: string;
  keywords: { tr: string; en: string };
}

export interface AspectInfo {
  key: string;
  symbol: string;
  tr: string;
  en: string;
  angle: number;
  orb: number; // tolerance in degrees
  color: string;
  nature: 'harmonious' | 'challenging' | 'neutral';
}

export const PLANETS: PlanetInfo[] = [
  { key: 'sun', symbol: '☉', glyph: '☉', tr: 'Güneş', en: 'Sun', color: '#FFD700' },
  { key: 'moon', symbol: '☽', glyph: '☽', tr: 'Ay', en: 'Moon', color: '#C0C0C0' },
  { key: 'mercury', symbol: '☿', glyph: '☿', tr: 'Merkür', en: 'Mercury', color: '#B8860B' },
  { key: 'venus', symbol: '♀', glyph: '♀', tr: 'Venüs', en: 'Venus', color: '#FF69B4' },
  { key: 'mars', symbol: '♂', glyph: '♂', tr: 'Mars', en: 'Mars', color: '#FF4500' },
  { key: 'jupiter', symbol: '♃', glyph: '♃', tr: 'Jüpiter', en: 'Jupiter', color: '#9370DB' },
  { key: 'saturn', symbol: '♄', glyph: '♄', tr: 'Satürn', en: 'Saturn', color: '#8B7355' },
  { key: 'uranus', symbol: '♅', glyph: '♅', tr: 'Uranüs', en: 'Uranus', color: '#00CED1' },
  { key: 'neptune', symbol: '♆', glyph: '♆', tr: 'Neptün', en: 'Neptune', color: '#4169E1' },
  { key: 'pluto', symbol: '♇', glyph: '♇', tr: 'Plüton', en: 'Pluto', color: '#8B0000' },
];

export const ZODIAC_SIGNS: ZodiacSignInfo[] = [
  { key: 'aries', symbol: '♈', tr: 'Koç', en: 'Aries', element: 'fire', elementColor: '#FF6347', startDegree: 0 },
  { key: 'taurus', symbol: '♉', tr: 'Boğa', en: 'Taurus', element: 'earth', elementColor: '#8B4513', startDegree: 30 },
  { key: 'gemini', symbol: '♊', tr: 'İkizler', en: 'Gemini', element: 'air', elementColor: '#87CEEB', startDegree: 60 },
  { key: 'cancer', symbol: '♋', tr: 'Yengeç', en: 'Cancer', element: 'water', elementColor: '#4682B4', startDegree: 90 },
  { key: 'leo', symbol: '♌', tr: 'Aslan', en: 'Leo', element: 'fire', elementColor: '#FF6347', startDegree: 120 },
  { key: 'virgo', symbol: '♍', tr: 'Başak', en: 'Virgo', element: 'earth', elementColor: '#8B4513', startDegree: 150 },
  { key: 'libra', symbol: '♎', tr: 'Terazi', en: 'Libra', element: 'air', elementColor: '#87CEEB', startDegree: 180 },
  { key: 'scorpio', symbol: '♏', tr: 'Akrep', en: 'Scorpio', element: 'water', elementColor: '#4682B4', startDegree: 210 },
  { key: 'sagittarius', symbol: '♐', tr: 'Yay', en: 'Sagittarius', element: 'fire', elementColor: '#FF6347', startDegree: 240 },
  { key: 'capricorn', symbol: '♑', tr: 'Oğlak', en: 'Capricorn', element: 'earth', elementColor: '#8B4513', startDegree: 270 },
  { key: 'aquarius', symbol: '♒', tr: 'Kova', en: 'Aquarius', element: 'air', elementColor: '#87CEEB', startDegree: 300 },
  { key: 'pisces', symbol: '♓', tr: 'Balık', en: 'Pisces', element: 'water', elementColor: '#4682B4', startDegree: 330 },
];

export const HOUSES: HouseInfo[] = [
  { number: 1, tr: '1. Ev - Benlik', en: '1st House - Self', keywords: { tr: 'Kimlik, görünüş, ilk izlenim', en: 'Identity, appearance, first impression' } },
  { number: 2, tr: '2. Ev - Değerler', en: '2nd House - Values', keywords: { tr: 'Para, mülk, özsaygı', en: 'Money, possessions, self-worth' } },
  { number: 3, tr: '3. Ev - İletişim', en: '3rd House - Communication', keywords: { tr: 'İletişim, öğrenme, kardeşler', en: 'Communication, learning, siblings' } },
  { number: 4, tr: '4. Ev - Yuva', en: '4th House - Home', keywords: { tr: 'Aile, kökler, ev, güvenlik', en: 'Family, roots, home, security' } },
  { number: 5, tr: '5. Ev - Yaratıcılık', en: '5th House - Creativity', keywords: { tr: 'Aşk, eğlence, çocuklar, sanat', en: 'Romance, fun, children, art' } },
  { number: 6, tr: '6. Ev - Sağlık', en: '6th House - Health', keywords: { tr: 'Sağlık, iş, günlük rutinler', en: 'Health, work, daily routines' } },
  { number: 7, tr: '7. Ev - İlişkiler', en: '7th House - Relationships', keywords: { tr: 'Evlilik, ortaklıklar, anlaşmalar', en: 'Marriage, partnerships, agreements' } },
  { number: 8, tr: '8. Ev - Dönüşüm', en: '8th House - Transformation', keywords: { tr: 'Dönüşüm, gizem, ortak kaynaklar', en: 'Transformation, mystery, shared resources' } },
  { number: 9, tr: '9. Ev - Felsefe', en: '9th House - Philosophy', keywords: { tr: 'Yolculuk, felsefe, yüksek öğrenim', en: 'Travel, philosophy, higher education' } },
  { number: 10, tr: '10. Ev - Kariyer', en: '10th House - Career', keywords: { tr: 'Kariyer, statü, toplumsal rol', en: 'Career, status, public role' } },
  { number: 11, tr: '11. Ev - Topluluk', en: '11th House - Community', keywords: { tr: 'Arkadaşlar, gruplar, umutlar', en: 'Friends, groups, hopes' } },
  { number: 12, tr: '12. Ev - Bilinçaltı', en: '12th House - Subconscious', keywords: { tr: 'Bilinçaltı, ruhsallık, gizli güçler', en: 'Subconscious, spirituality, hidden strengths' } },
];

export const ASPECTS: AspectInfo[] = [
  { key: 'conjunction', symbol: '☌', tr: 'Kavuşum', en: 'Conjunction', angle: 0, orb: 8, color: '#FFD700', nature: 'neutral' },
  { key: 'opposition', symbol: '☍', tr: 'Karşıt', en: 'Opposition', angle: 180, orb: 8, color: '#FF4500', nature: 'challenging' },
  { key: 'trine', symbol: '△', tr: 'Üçgen', en: 'Trine', angle: 120, orb: 8, color: '#4CAF50', nature: 'harmonious' },
  { key: 'square', symbol: '□', tr: 'Kare', en: 'Square', angle: 90, orb: 7, color: '#FF4500', nature: 'challenging' },
  { key: 'sextile', symbol: '⚹', tr: 'Altıgen', en: 'Sextile', angle: 60, orb: 6, color: '#4CAF50', nature: 'harmonious' },
];

// Get zodiac sign from ecliptic longitude (0-360)
export function getSignFromDegree(degree: number): ZodiacSignInfo {
  const normalized = ((degree % 360) + 360) % 360;
  const index = Math.floor(normalized / 30);
  return ZODIAC_SIGNS[index];
}

// Get degree within sign (0-30)
export function getDegreeInSign(degree: number): number {
  const normalized = ((degree % 360) + 360) % 360;
  return normalized % 30;
}

// Format planet position as readable string
export function formatPosition(degree: number, lang: 'tr' | 'en'): string {
  const sign = getSignFromDegree(degree);
  const degInSign = getDegreeInSign(degree);
  const deg = Math.floor(degInSign);
  const min = Math.floor((degInSign - deg) * 60);
  return `${sign[lang]} ${deg}°${min.toString().padStart(2, '0')}'`;
}
