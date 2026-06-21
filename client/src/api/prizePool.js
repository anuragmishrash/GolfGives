import { supabase } from '../lib/supabase';

export const getPrizePool = async () => {
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_status', 'active');

  if (error) {
    console.error('Error fetching prize pool:', error);
    return { fiveMatch: 0, fourMatch: 0, threeMatch: 0, total: 0 };
  }

  // 1 active sub = £5 added to pool
  const total = (count || 0) * 5;

  return {
    total,
    fiveMatch: total * 0.50,
    fourMatch: total * 0.30,
    threeMatch: total * 0.20,
  };
};
