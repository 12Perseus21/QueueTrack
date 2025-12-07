import { useEffect, useState } from "react";
import { supabase } from "../api/supabaseClient";

export function useUserRole() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        setLoading(false);
        return;
      }

      setUserId(authData.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      setRole(profile?.role || null);
      setLoading(false);
    }

    load();
  }, []);

  return { loading, userId, role };
}
