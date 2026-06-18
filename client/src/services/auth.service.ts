import { supabase } from "./supabase";
import type { Session } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  subscription_plan: string;
  created_at: string;
  updated_at: string;
}

export interface UserConsents {
  terms_accepted: boolean;
  risk_disclosure_accepted: boolean;
  accepted_at: string;
}

export const authService = {
  /**
   * Register a new user with email and password, passing full_name in metadata.
   */
  async register(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;
    return data;
  },

  /**
   * Sign in with email and password.
   */
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Log out the current user session.
   */
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Retrieve the current session.
   */
  async getSession(): Promise<Session | null> {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  /**
   * Retrieve the profile data for the authenticated user.
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      // It's possible the profile isn't created yet due to trigger delay
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data as UserProfile;
  },

  /**
   * Submit or update user consents.
   */
  async saveConsents(userId: string, terms: boolean, risk: boolean) {
    const { data, error } = await supabase
      .from("user_consents")
      .upsert({
        user_id: userId,
        terms_accepted: terms,
        risk_disclosure_accepted: risk,
        accepted_at: new Date().toISOString(),
      });

    if (error) throw error;
    return data;
  },

  /**
   * Check if user consents already exist.
   */
  async getConsents(userId: string): Promise<UserConsents | null> {
    const { data, error } = await supabase
      .from("user_consents")
      .select("terms_accepted, risk_disclosure_accepted, accepted_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data as UserConsents | null;
  },

  /**
   * Request password reset link.
   */
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    return data;
  },
};
