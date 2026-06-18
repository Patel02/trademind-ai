import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../../services/supabase";
import { authService } from "../../services/auth.service";
import type { UserProfile } from "../../services/auth.service";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (userId: string) => {
    try {
      const userProfile = await authService.getProfile(userId);
      setProfile(userProfile);
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Check active session on mount
    const initSession = async () => {
      try {
        if (import.meta.env.DEV && localStorage.getItem("bypass_auth") === "true") {
          const mockUser = {
            id: "mock-user-id",
            email: "mock.trader@trademind.ai",
          } as any;
          const mockSession = {
            user: mockUser,
            access_token: "mock-token",
          } as any;
          setSession(mockSession);
          setUser(mockUser);
          setProfile({
            id: "mock-user-id",
            email: "mock.trader@trademind.ai",
            full_name: "Mock Trader",
            avatar_url: null,
            role: "trader",
            subscription_plan: "premium",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as UserProfile);
          setLoading(false);
          return;
        }

        const activeSession = await authService.getSession();
        setSession(activeSession);
        setUser(activeSession?.user ?? null);
        if (activeSession?.user) {
          await fetchProfile(activeSession.user.id);
        }
      } catch (err) {
        console.error("Error initializing session:", err);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (import.meta.env.DEV && localStorage.getItem("bypass_auth") === "true") {
          setLoading(false);
          return;
        }
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem("bypass_auth");
      await authService.logout();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (err) {
      console.error("Error during logout:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
