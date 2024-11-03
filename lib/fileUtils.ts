export const readFileContent = async (file: File): Promise<string> => {
    if (file.type === "text/plain") {
        return await file.text();
    }

    // For now, return a message for unsupported files
    if (!file.type.match("text.*")) {
        return `[This file type (${file.type}) is not yet supported for preview]`;
    }

    return await file.text();
};
