import { createClient } from "@supabase/supabase-js";
import { supabase } from "./supabase/instance";
import { Document } from "@/lib/types/type";
import { data } from "autoprefixer";
import sendEventToMixpanel from "@/lib/sendEventToMixpanel";
import createUserMixpanel from "@/lib/createUserMixpanel";

// Document operations
export const sFetchDocuments = async (id: string) => {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return { data, error };
};

export const addDocument = async (data: any) => {
  const { data: newDoc, error } = await supabase
    .from("documents")
    .insert(data)
    .select();

  if (error) throw error;
  return { data: newDoc, error };
};

export const sUpdateDocument = async (
  id: string,
  content: string,
  title: string,
  conversation: string[],
) => {
  const { data: updatedDoc, error } = await supabase
    .from("documents")
    .update({
      content,
      conversation,
      title,
    })
    .eq("id", id)
    .select();

  if (error) throw error;
  return { updatedDoc, error };
};

export const sdeleteDocument = async (id: string) => {
  const { error } = await supabase.from("documents").delete().eq("id", id);

  if (error) throw error;
  return { error };
};

export const getToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
};

// User operations
export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

export const signIn = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("Error signing in:", error);
  }
};

export const checkAndInitializeUser = async (userId: string, user: any) => {
  try {
    // Check if user already has word credits
    const { data: existingCredits, error: checkError } = await supabase
      .from("word_credits")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (checkError && checkError.code === "PGRST116") {
      // User doesn't have credits yet, initialize them
      const { data: newCredits, error: insertError } = await supabase
        .from("word_credits")
        .insert([
          {
            user_id: userId,
            remaining_credits: 1000,
            total_words_generated: 0,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;
      sendEventToMixpanel("sign_up", user);
      createUserMixpanel(userId, {
        name: user.user_metadata.full_name,
        email: user.email,
        last_sign_in: user.last_sign_in_at,
        plan: "free",
      });
      return { isNewUser: true, credits: newCredits };
    } else if (checkError) {
      throw checkError;
    }

    return { isNewUser: false, credits: existingCredits };
  } catch (error) {
    console.error("Error checking/initializing user:", error);
    throw error;
  }
};

export const remaining50 = async () => {
  const { data, error } = await supabase
    .from("first_50")
    .select("discount_count_remaining")
    .single();

  return data?.discount_count_remaining;
};

export const deductFirst50 = async (userId: string, wordCount: number) => {
  try {
    const { data, error } = await supabase
      .from("first_50")
      .select("discount_count_remaining")
      .single();

    const { error: updateError } = await supabase
      .from("first_50")
      .update({
        discount_count_remaining: data?.discount_count_remaining - 1,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error("Error deducting remaining count:", error);
    throw error;
  }
};

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error signing out:", error);
  }
};

export async function checkSubscriptionStatus(
  userId: string,
): Promise<"active" | "inactive"> {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", userId)
      .single();

    if (error) throw error;

    return data?.status === "active" ? "active" : "inactive";
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return "inactive"; // Default to inactive if there's an error
  }
}

const DAILY_LIMIT = 30;

export async function checkAndUpdateConversationCount(
  userId: string,
): Promise<{ canProceed: boolean; resetTime: Date }> {
  const now = new Date();
  const todayDate = now.toISOString().split("T")[0]; // Get just the date part: YYYY-MM-DD
  const tomorrowStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );

  try {
    // Check if there's an existing count for today
    let { data: existingCount, error } = await supabase
      .from("daily_conversation_counts")
      .select("count")
      .eq("user_id", userId)
      .eq("date", todayDate)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    let currentCount = existingCount?.count || 0;

    if (currentCount >= DAILY_LIMIT) {
      return { canProceed: false, resetTime: tomorrowStart };
    }

    // Increment the count
    if (existingCount) {
      const { error: updateError } = await supabase
        .from("daily_conversation_counts")
        .update({ count: currentCount + 1 })
        .eq("user_id", userId)
        .eq("date", todayDate);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from("daily_conversation_counts")
        .insert({
          user_id: userId,
          date: todayDate,
          count: 1,
        });

      if (insertError) throw insertError;
    }

    return { canProceed: true, resetTime: tomorrowStart };
  } catch (error) {
    console.error("Error checking/updating conversation count:", error);
    return { canProceed: false, resetTime: tomorrowStart };
  }
}

// Add more functions as needed
