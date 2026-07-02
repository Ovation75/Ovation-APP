import { supabase } from './supabase';

// Returns true if a profiles row already exists for the given auth user id.
// Used to route authenticated users to Feed (has profile) vs ProfileSetup
// (signed up but never finished setup).
export async function hasProfile(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}
