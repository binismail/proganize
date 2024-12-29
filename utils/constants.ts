export const STORAGE_CONSTANTS = {
  BUCKET_NAME: 'pdf-documents',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
};

export const ERROR_MESSAGES = {
  CONVERSATION_NOT_FOUND: 'Conversation not found.',
  DOCUMENT_NOT_FOUND: 'Document not found.',
  DOCUMENT_GENERATION_ERROR: 'Failed to generate document. Please try again.',
  CHAT_GENERATION_ERROR: 'Failed to generate chat response. Please try again.',
  UPLOAD_FAILED: 'Failed to upload PDF. Please try again.',
  DELETE_CONVERSATION_ERROR: 'Failed to delete conversation. Please try again.',
  FILE_TOO_LARGE: 'File size exceeds 10MB limit',
  INVALID_FILE_TYPE: 'Please upload a valid PDF file',
};

export const HOLIDAY_PROMOTIONS = [
  {
    title: "Holiday Special",
    description: "Get 50% extra credits this holiday season! ",
    baseCredits: 5000,
    bonusCredits: 2500,
    price: 10,
    isHolidayOffer: true,
  },
  {
    title: "New Year Bundle",
    description:
      "Start the year with a bang! Double credits for a limited time. ",
    baseCredits: 10000,
    bonusCredits: 10000,
    price: 20,
    isHolidayOffer: true,
  },
];

export const REGULAR_PACKAGES = [
  {
    title: "Starter Pack",
    description: "Perfect for small projects and quick tasks",
    baseCredits: 5000,
    price: 10,
    isSpecialOffer: false,
  },
  {
    title: "Pro Pack",
    description: "Most popular choice for professionals",
    baseCredits: 15000,
    price: 25,
    isSpecialOffer: true,
  },
];