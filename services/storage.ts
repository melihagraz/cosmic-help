import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  PROFILE: '@kismet_profile',
  ONBOARDING_DONE: '@kismet_onboarding_done',
  LANGUAGE: '@kismet_language',
  READINGS_HISTORY: '@kismet_readings',
};

export interface UserProfile {
  name: string;
  birthDay: number;
  birthMonth: number;
  birthYear: number;
  birthTime?: string; // HH:mm format, optional
  city: string;
  gender: string;
  relation: string;
  focus: string[];
  interests: string[];
  experience: string;
  matchingOptIn?: boolean;  // User opted in to Cosmic Matching
  guidanceOptIn?: boolean;  // User opted in to Weekly Guidance
}

export const storage = {
  // Profile
  async saveProfile(profile: UserProfile): Promise<void> {
    await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  },

  // Save profile without setting onboarding done (for sync updates)
  async saveProfileOnly(profile: UserProfile): Promise<void> {
    await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  },

  async getProfile(): Promise<UserProfile | null> {
    const data = await AsyncStorage.getItem(KEYS.PROFILE);
    return data ? JSON.parse(data) : null;
  },

  // Onboarding
  async setOnboardingDone(): Promise<void> {
    await AsyncStorage.setItem(KEYS.ONBOARDING_DONE, 'true');
  },

  async isOnboardingDone(): Promise<boolean> {
    const val = await AsyncStorage.getItem(KEYS.ONBOARDING_DONE);
    return val === 'true';
  },

  // Language
  async setLanguage(lang: 'tr' | 'en'): Promise<void> {
    await AsyncStorage.setItem(KEYS.LANGUAGE, lang);
  },

  async getLanguage(): Promise<'tr' | 'en' | null> {
    const val = await AsyncStorage.getItem(KEYS.LANGUAGE);
    return val as 'tr' | 'en' | null;
  },

  // Readings history
  async saveReading(reading: any): Promise<void> {
    const history = await this.getReadings();
    history.unshift({ ...reading, date: new Date().toISOString() });
    // Son 100 okumayı tut
    await AsyncStorage.setItem(KEYS.READINGS_HISTORY, JSON.stringify(history.slice(0, 100)));
  },

  async getReadings(): Promise<any[]> {
    const data = await AsyncStorage.getItem(KEYS.READINGS_HISTORY);
    return data ? JSON.parse(data) : [];
  },

  // Reset
  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  },
};
