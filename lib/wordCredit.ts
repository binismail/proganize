import { supabase } from "@/utils/supabase/instance";

export const checkWordCredits = async (userId: string): Promise<number> => {
    try {
        const { data, error } = await supabase
            .from("word_credits")
            .select("remaining_credits")
            .eq("user_id", userId)
            .single();

        if (error) throw error;
        return data.remaining_credits;
    } catch (error) {
        console.error("Error checking word credits:", error);
        throw error;
    }
};

export const deductWordCredits = async (userId: string, wordCount: number) => {
    try {
        const { data: credits, error: creditsError } = await supabase
            .from("word_credits")
            .select("remaining_credits, total_words_generated")
            .eq("user_id", userId)
            .single();

        if (creditsError) throw creditsError;

        if (credits.remaining_credits < wordCount) {
            throw new Error("Insufficient word credits");
        }

        const { error: updateError } = await supabase
            .from("word_credits")
            .update({
                remaining_credits: credits.remaining_credits - wordCount,
                total_words_generated: credits.total_words_generated +
                    wordCount,
                updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

        if (updateError) throw updateError;

        return credits.remaining_credits - wordCount;
    } catch (error) {
        console.error("Error deducting word credits:", error);
        throw error;
    }
};

export const addWordCredits = async (
    userId: string,
    additionalCredits: number,
) => {
    try {
        // First get current credits
        const { data: currentData, error: fetchError } = await supabase
            .from("word_credits")
            .select("remaining_credits")
            .eq("user_id", userId)
            .single();

        if (fetchError) throw fetchError;

        // Then update with the new total
        const { data, error } = await supabase
            .from("word_credits")
            .update({
                remaining_credits: currentData.remaining_credits +
                    additionalCredits,
                updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
            .select()
            .single();

        if (error) throw error;
        return data.remaining_credits;
    } catch (error) {
        console.error("Error adding word credits:", error);
        throw error;
    }
};
