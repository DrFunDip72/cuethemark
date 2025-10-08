-- Create referrer aliases table for name normalization
CREATE TABLE public.referrer_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alias_name text NOT NULL UNIQUE,
  canonical_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referrer_aliases ENABLE ROW LEVEL SECURITY;

-- Admins can manage aliases
CREATE POLICY "Admins can view all aliases"
  ON public.referrer_aliases
  FOR SELECT
  USING (user_is_admin(auth.uid()));

CREATE POLICY "Admins can insert aliases"
  ON public.referrer_aliases
  FOR INSERT
  WITH CHECK (user_is_admin(auth.uid()));

CREATE POLICY "Admins can update aliases"
  ON public.referrer_aliases
  FOR UPDATE
  USING (user_is_admin(auth.uid()));

CREATE POLICY "Admins can delete aliases"
  ON public.referrer_aliases
  FOR DELETE
  USING (user_is_admin(auth.uid()));

-- Update get_top_referrers function to use aliases
CREATE OR REPLACE FUNCTION public.get_top_referrers()
RETURNS TABLE(
  referrer_normalized text,
  referrer_display text,
  referral_count bigint,
  percentage numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH normalized_referrers AS (
    SELECT 
      COALESCE(ra.canonical_name, TRIM(LOWER(p.referred_by))) as referrer_normalized,
      p.referred_by as original_name
    FROM profiles p
    LEFT JOIN referrer_aliases ra ON TRIM(LOWER(p.referred_by)) = ra.alias_name
    WHERE p.referred_by IS NOT NULL
  ),
  aggregated AS (
    SELECT 
      referrer_normalized,
      MAX(original_name) as referrer_display,
      COUNT(*)::bigint as referral_count
    FROM normalized_referrers
    GROUP BY referrer_normalized
  )
  SELECT 
    a.referrer_normalized,
    a.referrer_display,
    a.referral_count,
    ROUND(
      CASE 
        WHEN (SELECT COUNT(*) FROM profiles WHERE referred_by IS NOT NULL) = 0 THEN 0
        ELSE (a.referral_count::numeric / (SELECT COUNT(*) FROM profiles WHERE referred_by IS NOT NULL)::numeric * 100)
      END,
      1
    ) as percentage
  FROM aggregated a
  ORDER BY a.referral_count DESC;
$function$;

-- Seed initial aliases for Justin variations
INSERT INTO public.referrer_aliases (alias_name, canonical_name) VALUES
  ('justin', 'justin maxwell'),
  ('justin himself', 'justin maxwell');