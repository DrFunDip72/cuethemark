-- Create database functions for referral analytics

-- Function to get referral overview statistics
CREATE OR REPLACE FUNCTION public.get_referral_overview()
RETURNS TABLE (
  total_users bigint,
  referred_users bigint,
  organic_users bigint,
  referral_rate numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    COUNT(*)::bigint as total_users,
    COUNT(CASE WHEN referred_by IS NOT NULL THEN 1 END)::bigint as referred_users,
    COUNT(CASE WHEN referred_by IS NULL THEN 1 END)::bigint as organic_users,
    ROUND(
      CASE 
        WHEN COUNT(*) = 0 THEN 0
        ELSE (COUNT(CASE WHEN referred_by IS NOT NULL THEN 1 END)::numeric / COUNT(*)::numeric * 100)
      END,
      1
    ) as referral_rate
  FROM profiles;
$$;

-- Function to get top referrers with normalized names
CREATE OR REPLACE FUNCTION public.get_top_referrers()
RETURNS TABLE (
  referrer_normalized text,
  referrer_display text,
  referral_count bigint,
  percentage numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    TRIM(LOWER(referred_by)) as referrer_normalized,
    MAX(referred_by) as referrer_display,
    COUNT(*)::bigint as referral_count,
    ROUND(
      CASE 
        WHEN (SELECT COUNT(*) FROM profiles WHERE referred_by IS NOT NULL) = 0 THEN 0
        ELSE (COUNT(*)::numeric / (SELECT COUNT(*) FROM profiles WHERE referred_by IS NOT NULL)::numeric * 100)
      END,
      1
    ) as percentage
  FROM profiles 
  WHERE referred_by IS NOT NULL 
  GROUP BY TRIM(LOWER(referred_by))
  ORDER BY referral_count DESC;
$$;