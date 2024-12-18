"use client";

import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from "react";
import { User } from "@supabase/supabase-js";
import { PDFConversation } from "@/types/pdf";
import { getPreviouslyCachedImageOrNull } from "next/dist/server/image-optimizer";

interface Document {
  id: string;
  title: string;
  updated_at?: string;
  created_at: string;
}

interface ConversationItem {
  role: string;
  content: string;
}

interface AppState {
  user: User | null;
  productIdea: string;
  documents: Document[];
  generatedDocument: string;
  conversation: ConversationItem[];
  selectedDocument: Document | null;
  isEditorVisible: boolean;
  isGenerating: boolean;
  isRenaming: boolean;
  newTitle: string;
  showInitialContent: boolean;
  hasGenerationStarted: boolean;
  isLoading: boolean;
  currentDocumentId: string | null;
  documentUpdated: boolean;
  subscription: any;
  paymentMethods: any[];
  invoices: any[];
  subscriptionStatus: string;
  savedState: any;
  saveStatus: boolean;
  openDocument: boolean;
  wordCredits: {
    remaining_credits: number;
    total_words_generated: number;
  } | null;
  showUpgrade: boolean;
  showTopup: boolean;
  activeTab: string;
  currentPDFConversation: PDFConversation | null;
}

const initialState: AppState = {
  user: null,
  productIdea: "",
  documents: [],
  generatedDocument: "<p>Generated document for: </p>",
  conversation: [],
  selectedDocument: null,
  isEditorVisible: false,
  isGenerating: false,
  isRenaming: false,
  newTitle: "",
  showInitialContent: true,
  hasGenerationStarted: false,
  isLoading: true,
  currentDocumentId: null,
  documentUpdated: false,
  subscription: null,
  paymentMethods: [],
  invoices: [],
  subscriptionStatus: "inactive",
  savedState: null,
  saveStatus: true,
  openDocument: false,
  wordCredits: null,
  showUpgrade: false,
  showTopup: false,
  activeTab: "writer",
  currentPDFConversation: null,
};

// Define actions
type Action =
  | { type: "SET_USER"; payload: User | null }
  | { type: "SET_PRODUCT_IDEA"; payload: string }
  | { type: "SET_DOCUMENTS"; payload: Document[] }
  | { type: "SET_GENERATED_DOCUMENT"; payload: string }
  | { type: "SET_CONVERSATION"; payload: ConversationItem[] }
  | { type: "SET_SELECTED_DOCUMENT"; payload: Document | null }
  | { type: "SET_IS_EDITOR_VISIBLE"; payload: boolean }
  | { type: "SET_IS_GENERATING"; payload: boolean }
  | { type: "SET_IS_RENAMING"; payload: boolean }
  | { type: "SET_NEW_TITLE"; payload: string }
  | { type: "SET_SHOW_INITIAL_CONTENT"; payload: boolean }
  | { type: "SET_HAS_GENERATION_STARTED"; payload: boolean }
  | { type: "SET_IS_LOADING"; payload: boolean }
  | { type: "SET_CURRENT_DOCUMENT_ID"; payload: string | null }
  | { type: "SET_DOCUMENT_UPDATED"; payload: boolean }
  | { type: "SET_SUBSCRIPTION"; payload: any }
  | { type: "SET_PAYMENT_METHODS"; payload: any[] }
  | { type: "SET_INVOICES"; payload: any[] }
  | { type: "SET_SUBSCRIPTION_STATUS"; payload: string }
  | { type: "INITIALIZE_STATE"; payload: Partial<AppState> }
  | { type: "SET_SAVING_STATUS"; payload: boolean }
  | { type: "SET_OPEN_DOCUMENT"; payload: boolean }
  | { type: "SET_WORD_CREDITS"; payload: any }
  | { type: "SET_SHOW_UPGRADE_MODAL"; payload: boolean }
  | { type: "SET_SHOW_TOPUP_MODAL"; payload: boolean }
  | { type: "SET_ACTIVE_TAB"; payload: string }
  | { type: "SET_CURRENT_PDF_CONVERSATION"; payload: PDFConversation | null };

const AppReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload };
    case "SET_PRODUCT_IDEA":
      return { ...state, productIdea: action.payload };
    case "SET_DOCUMENTS":
      return { ...state, documents: action.payload };
    case "SET_GENERATED_DOCUMENT":
      return { ...state, generatedDocument: action.payload };
    case "SET_CONVERSATION":
      return { ...state, conversation: action.payload as ConversationItem[] };
    case "SET_SELECTED_DOCUMENT":
      return { ...state, selectedDocument: action.payload };
    case "SET_IS_EDITOR_VISIBLE":
      return { ...state, isEditorVisible: action.payload };
    case "SET_IS_GENERATING":
      return { ...state, isGenerating: action.payload };
    case "SET_IS_RENAMING":
      return { ...state, isRenaming: action.payload };
    case "SET_NEW_TITLE":
      return { ...state, newTitle: action.payload };
    case "SET_SHOW_INITIAL_CONTENT":
      return { ...state, showInitialContent: action.payload };
    case "SET_HAS_GENERATION_STARTED":
      return { ...state, hasGenerationStarted: action.payload };
    case "SET_IS_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_CURRENT_DOCUMENT_ID":
      return { ...state, currentDocumentId: action.payload };
    case "SET_DOCUMENT_UPDATED":
      return { ...state, documentUpdated: action.payload };
    case "SET_SUBSCRIPTION":
      return { ...state, subscription: action.payload };
    case "SET_PAYMENT_METHODS":
      return { ...state, paymentMethods: action.payload };
    case "SET_INVOICES":
      return { ...state, invoices: action.payload };
    case "SET_SUBSCRIPTION_STATUS":
      return { ...state, subscriptionStatus: action.payload };
    case "INITIALIZE_STATE":
      return { ...state, ...action.payload }; // Initialize from saved state
    case "SET_SAVING_STATUS":
      return { ...state, saveStatus: action.payload };
    case "SET_OPEN_DOCUMENT":
      return { ...state, openDocument: action.payload };
    case "SET_WORD_CREDITS":
      return {
        ...state,
        wordCredits: action.payload,
      };
    case "SET_SHOW_UPGRADE_MODAL":
      return {
        ...state,
        showUpgrade: action.payload,
      };
    case "SET_SHOW_TOPUP_MODAL":
      return {
        ...state,
        showTopup: action.payload,
      };
    case "SET_ACTIVE_TAB":
      return {
        ...state,
        activeTab: action.payload,
      };
    case "SET_CURRENT_PDF_CONVERSATION":
      return {
        ...state,
        currentPDFConversation: action.payload,
      };
    default:
      return state;
  }
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => null });

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(AppReducer, initialState);

  useEffect(() => {
    const savedState = localStorage.getItem("appState");
    if (savedState) {
      dispatch({ type: "INITIALIZE_STATE", payload: JSON.parse(savedState) });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("appState", JSON.stringify(state));
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};
