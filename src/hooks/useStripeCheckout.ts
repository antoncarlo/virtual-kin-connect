import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CheckoutOptions {
  type: "subscription" | "tokens";
  planId: string;
}

export function useStripeCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const checkout = async ({ type, planId }: CheckoutOptions) => {
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to make a purchase",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: {
          type,
          planId,
          userId: user.id,
          email: user.email,
          successUrl: `${window.location.origin}/dashboard?checkout=success`,
          cancelUrl: `${window.location.origin}/dashboard?checkout=canceled`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout failed",
        description: error.message || "Unable to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openPortal = async () => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("stripe-portal", {
        body: {
          returnUrl: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Portal error:", error);
      toast({
        title: "Unable to open billing portal",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { checkout, openPortal, isLoading };
}
