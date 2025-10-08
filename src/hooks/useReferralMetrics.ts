import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ReferralOverview {
  totalUsers: number;
  referredUsers: number;
  organicUsers: number;
  referralRate: number;
}

export interface TopReferrer {
  referrerNormalized: string;
  referrerDisplay: string;
  referralCount: number;
  percentage: number;
}

export interface RecentReferral {
  email: string;
  displayName: string | null;
  referredBy: string;
  createdAt: string;
}

export const useReferralMetrics = () => {
  const overviewQuery = useQuery({
    queryKey: ["referral-overview"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_referral_overview" as any);
      
      if (error) throw error;
      
      return {
        totalUsers: data[0].total_users,
        referredUsers: data[0].referred_users,
        organicUsers: data[0].organic_users,
        referralRate: data[0].referral_rate,
      } as ReferralOverview;
    },
  });

  const topReferrersQuery = useQuery({
    queryKey: ["top-referrers"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_top_referrers" as any);
      
      if (error) throw error;
      
      return data.map(item => ({
        referrerNormalized: item.referrer_normalized,
        referrerDisplay: item.referrer_display,
        referralCount: item.referral_count,
        percentage: item.percentage,
      })) as TopReferrer[];
    },
  });

  const recentReferralsQuery = useQuery({
    queryKey: ["recent-referrals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("email, display_name, referred_by, created_at")
        .not("referred_by", "is", null)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      return data.map(d => ({
        email: d.email,
        displayName: d.display_name,
        referredBy: d.referred_by!,
        createdAt: d.created_at,
      })) as RecentReferral[];
    },
  });

  return {
    overview: overviewQuery.data,
    topReferrers: topReferrersQuery.data,
    recentReferrals: recentReferralsQuery.data,
    isLoading: overviewQuery.isLoading || topReferrersQuery.isLoading || recentReferralsQuery.isLoading,
    error: overviewQuery.error || topReferrersQuery.error || recentReferralsQuery.error,
  };
};
