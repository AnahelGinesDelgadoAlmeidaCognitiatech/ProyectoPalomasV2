import React, { createContext, useContext, useEffect, useState } from "react";
import { type User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { initDb } from "@/lib/db";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for mock session first
    const mockUser = localStorage.getItem("pigeondb_mock_user");
    if (mockUser) {
      const parsed = JSON.parse(mockUser);
      initDb(parsed.id);
      setUser(parsed);
      setLoading(false);
      return;
    }

    // Check active Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        initDb(session.user.id);
        setUser(session.user);
      } else {
        initDb("public");
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        initDb(session.user.id);
        setUser(session.user);
      } else if (!localStorage.getItem("pigeondb_mock_user")) {
        initDb("public");
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    localStorage.removeItem("pigeondb_mock_user");
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
