import { useEffect, useState } from "react";
import { supabase } from "../api/supabaseClient";

export function useUserRole() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Helper function to fetch the profile
    const fetchRole = async (uid: string) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", uid)
          .single();

        if (error || !data) {
          console.error("Error fetching role:", error);
          setRole(null);
        } else {
          setRole(data.role);
        }
      } catch (err) {
        setRole(null);
      }
    };

    // 1. Initial Session Check
    const checkSession = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUserId(session.user.id);
        await fetchRole(session.user.id);
      } else {
        setUserId(null);
        setRole(null);
      }
      setLoading(false);
    };

    checkSession();

    // 2. Listen for Auth Changes (Login, Logout, Auto-refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // If user just logged in or session updated, update state
        // Only fetch if the user ID changed to avoid unnecessary API calls
        if (session.user.id !== userId) {
            setUserId(session.user.id);
            await fetchRole(session.user.id);
        }
      } else {
        // User logged out
        setUserId(null);
        setRole(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array is fine here

  return { loading, userId, role };
}