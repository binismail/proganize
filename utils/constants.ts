export const STORAGE_CONSTANTS = {
  BUCKET_NAME: 'pdf-documents',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
};

export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size exceeds 10MB limit',
  INVALID_FILE_TYPE: 'Please upload a valid PDF file',
  UPLOAD_FAILED: 'Failed to upload PDF. Please try again.',
  DELETE_CONVERSATION_ERROR: 'Failed to delete conversation. Please try again.',
};
