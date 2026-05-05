export const sanitizePromptInput = (input: string) => {
  return input
    .replace(/<\|.*?\|>/g, "")
    .replace(/SYSTEM:/gi, "")
    .replace(/IGNORE.*INSTRUCTIONS/gi, "")
    .replace(/OVERRIDE.*PROMPT/gi, "")
    .slice(0, 2000);
};

export const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;
