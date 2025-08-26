import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabaseClient";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function getSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    }
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      },
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return user;
}
