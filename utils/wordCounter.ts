export const countWords = (text: string): number => {
  return text.trim().split(/\s+/).length;
};

export const countTokens = (text: string): number => {
  // A rough estimation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
};

export const calculateWordCredits = (
  promptTokens: number,
  completionTokens: number
): number => {
  // Convert tokens to words (rough estimation)
  // GPT-4 costs more, so we multiply by 1.5
  return Math.ceil((promptTokens + completionTokens) * 1.5);
};
