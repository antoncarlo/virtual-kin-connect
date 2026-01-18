import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase-client";
import type { Tables } from "@/integrations/supabase/types";

type Referral = Tables<"referrals">;

export function useReferrals() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReferrals = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setReferralCode(null);
        setReferrals([]);
        setIsLoading(false);
        return;
      }

      // Get user's referral code
      const { data: myReferral, error: codeError } = await supabase
        .from("referrals")
        .select("referral_code")
        .eq("referrer_id", user.id)
        .eq("status", "pending")
        .limit(1)
        .maybeSingle();

      if (codeError) throw codeError;
      setReferralCode(myReferral?.referral_code || null);

      // Get completed referrals
      const { data: completedReferrals, error: referralsError } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false });

      if (referralsError) throw referralsError;
      setReferrals(completedReferrals || []);
    } catch (err) {
      console.error("Error fetching referrals:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateReferralCode = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if user already has a pending referral code
      const { data: existing } = await supabase
        .from("referrals")
        .select("referral_code")
        .eq("referrer_id", user.id)
        .eq("status", "pending")
        .maybeSingle();

      if (existing) {
        setReferralCode(existing.referral_code);
        return existing.referral_code;
      }

      // Generate new code
      const code = `KIND${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const { data, error } = await supabase
        .from("referrals")
        .insert({
          referrer_id: user.id,
          referral_code: code,
        })
        .select()
        .single();

      if (error) throw error;
      setReferralCode(data.referral_code);
      return data.referral_code;
    } catch (err) {
      console.error("Error generating referral code:", err);
      return null;
    }
  }, []);

  const getTotalBonusTokens = () => {
    return referrals.reduce((sum, r) => sum + r.bonus_tokens, 0);
  };

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  return {
    referralCode,
    referrals,
    isLoading,
    generateReferralCode,
    getTotalBonusTokens,
    refetch: fetchReferrals,
  };
}
