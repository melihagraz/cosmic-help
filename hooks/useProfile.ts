import { useState, useEffect, useCallback } from 'react';
import { storage, UserProfile } from '../services/storage';
import { supabase } from '../services/supabase';
import { getZodiacSign } from '../constants/zodiac';

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Try local first (fast)
      const local = await storage.getProfile();
      if (local) setProfile(local);

      // Then try Supabase (authoritative)
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (data) {
          const dbProfile: UserProfile = {
            name: data.name || local?.name || '',
            birthDay: data.birth_day || local?.birthDay || 1,
            birthMonth: data.birth_month || local?.birthMonth || 1,
            birthYear: data.birth_year || local?.birthYear || 2000,
            birthTime: data.birth_time || local?.birthTime,
            city: data.city || local?.city || '',
            gender: data.gender || local?.gender || '',
            relation: data.relation || local?.relation || '',
            focus: data.focus || local?.focus || [],
            interests: data.interests || local?.interests || [],
            experience: data.experience || local?.experience || '',
          };
          setProfile(dbProfile);
          // Update local cache
          await storage.saveProfileOnly(dbProfile);
        }
      }
    } catch (e) {
      console.error('Failed to load profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = useCallback(async (p: UserProfile) => {
    // Save locally
    await storage.saveProfile(p);
    setProfile(p);
    await storage.setOnboardingDone();

    // Sync to Supabase if authenticated
    await syncToSupabase(p);
  }, []);

  const updateProfileField = useCallback(async (fields: Partial<UserProfile>) => {
    const updated = { ...profile, ...fields } as UserProfile;
    setProfile(updated);
    await storage.saveProfileOnly(updated);

    // Sync specific fields to Supabase
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const dbFields: Record<string, any> = {};
      if (fields.relation !== undefined) dbFields.relation = fields.relation;
      if (fields.experience !== undefined) dbFields.experience = fields.experience;
      if (fields.birthTime !== undefined) dbFields.birth_time = fields.birthTime;

      if (Object.keys(dbFields).length > 0) {
        await supabase.from('profiles').update(dbFields).eq('id', session.user.id);
      }
    }
  }, [profile]);

  return { profile, loading, saveProfile, updateProfileField, reload: loadProfile };
}

// Sync local profile to Supabase DB
export async function syncToSupabase(p: UserProfile): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    const zodiac = getZodiacSign(p.birthDay, p.birthMonth);

    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id,
      name: p.name,
      birth_day: p.birthDay,
      birth_month: p.birthMonth,
      birth_year: p.birthYear,
      birth_time: p.birthTime || null,
      zodiac_sign: zodiac.key,
      city: p.city || '',
      gender: p.gender || 'other',
      relation: p.relation || 'single',
      experience: p.experience || 'new',
      focus: p.focus || [],
      interests: p.interests || [],
      is_active: true,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Supabase sync error:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Sync error:', e);
    return false;
  }
}
