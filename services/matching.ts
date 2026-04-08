import { supabase } from './supabase';

// ============= Types =============

export interface MatchingProfile {
  id: string;
  name: string;
  birth_day: number;
  birth_month: number;
  birth_year: number;
  zodiac_sign: string;
  city: string;
  gender: string;
  gender_preference: string;
  age_range_min: number;
  age_range_max: number;
  focus: string[];
  interests: string[];
  bio: string;
  photo_url: string | null;
  is_active: boolean;
}

export interface WeeklyMatch {
  id: string;
  week_start: string;
  user_a: string;
  user_b: string;
  compatibility_score: number;
  compatibility_report: string | null;
  user_a_action: 'pending' | 'liked' | 'passed';
  user_b_action: 'pending' | 'liked' | 'passed';
  is_mutual: boolean;
  // Joined profile of the other user
  other_profile?: MatchingProfile;
}

export interface MatchMessage {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

// ============= Profile Management =============

export async function upsertMatchingProfile(profile: Partial<MatchingProfile>): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      ...profile,
      updated_at: new Date().toISOString(),
    });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getMyMatchingProfile(): Promise<MatchingProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;
  return data as MatchingProfile;
}

export async function hasMatchingProfile(): Promise<boolean> {
  const profile = await getMyMatchingProfile();
  return !!profile;
}

// ============= Weekly Match =============

function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sunday
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

export async function getWeeklyMatch(): Promise<WeeklyMatch | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const weekStart = getCurrentWeekStart();

  const { data, error } = await supabase
    .from('weekly_matches')
    .select('*')
    .eq('week_start', weekStart)
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .single();

  if (error || !data) return null;

  const match = data as WeeklyMatch;

  // Get the other user's profile
  const otherId = match.user_a === user.id ? match.user_b : match.user_a;
  const { data: otherProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', otherId)
    .single();

  if (otherProfile) {
    match.other_profile = otherProfile as MatchingProfile;
  }

  return match;
}

// ============= Match Actions =============

export async function likeMatch(matchId: string): Promise<{ success: boolean; isMutual: boolean }> {
  return updateMatchAction(matchId, 'liked');
}

export async function passMatch(matchId: string): Promise<{ success: boolean; isMutual: boolean }> {
  return updateMatchAction(matchId, 'passed');
}

async function updateMatchAction(matchId: string, action: 'liked' | 'passed'): Promise<{ success: boolean; isMutual: boolean }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, isMutual: false };

  // Get current match to determine if user is A or B
  const { data: match } = await supabase
    .from('weekly_matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (!match) return { success: false, isMutual: false };

  const isUserA = match.user_a === user.id;
  const updateField = isUserA ? 'user_a_action' : 'user_b_action';

  const { error } = await supabase
    .from('weekly_matches')
    .update({ [updateField]: action })
    .eq('id', matchId);

  if (error) return { success: false, isMutual: false };

  // Check if mutual
  const otherAction = isUserA ? match.user_b_action : match.user_a_action;
  const isMutual = action === 'liked' && otherAction === 'liked';

  return { success: true, isMutual };
}

// ============= Messages =============

export async function sendMessage(matchId: string, content: string): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  if (content.length > 500) {
    return { success: false, error: 'Message too long (max 500 chars)' };
  }

  const { error } = await supabase
    .from('messages')
    .insert({
      match_id: matchId,
      sender_id: user.id,
      content,
    });

  if (error) {
    if (error.code === '23505') { // unique violation
      return { success: false, error: 'Already sent a message' };
    }
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getMessages(matchId: string): Promise<MatchMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data as MatchMessage[];
}

// ============= Compatibility Report =============

export async function getCompatibilityReport(matchId: string): Promise<string | null> {
  const { data } = await supabase
    .from('weekly_matches')
    .select('compatibility_report')
    .eq('id', matchId)
    .single();

  return data?.compatibility_report || null;
}

// ============= Helpers =============

export function getAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear;
}

export function getNextMondayCountdown(): { days: number; hours: number; minutes: number } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 7 : 8 - dayOfWeek;
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);

  const diff = nextMonday.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes };
}
