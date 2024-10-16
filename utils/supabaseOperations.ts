import { createClient } from "@supabase/supabase-js";
import { supabase } from "./supabase/instance";
import { Document } from "@/lib/types/type";
import { data } from "autoprefixer";

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
