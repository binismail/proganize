"use client"; // Add this line at the top of the file

// context/AppContext.tsx
import { createContext, useContext, useReducer, ReactNode } from "react";
import { useEffect } from "react";

interface Document {
  id: string;
  title: string;
  updated_at?: string;
  created_at: string;
  // Add other properties as needed
}

interface ConversationItem {
  role: string;
  content: string;
}

interface State {
  user: any;
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
  paymentMethods: any;
  invoices: any;
  subscriptionStatus: string;
  savedState: any;
}

const initialState: State = {
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
};

// Define actions
type Action =
  | { type: "SET_USER"; payload: any }
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
  | { type: "SET_CURRENT_DOCUMENT_ID"; payload: string }
  | { type: "SET_DOCUMENT_UPDATED"; payload: boolean }
  | { type: "SET_SUBSCRIPTION"; payload: any }
  | { type: "SET_PAYMENT_METHODS"; payload: any }
  | { type: "SET_INVOICES"; payload: any }
  | { type: "SET_SUBSCRIPTION_STATUS"; payload: string }
  | { type: "INITIALIZE_STATE"; payload: Partial<State> };

const AppReducer = (state: State, action: Action): State => {
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
      return { ...state, savedState: action.payload };
    case "SET_SUBSCRIPTION_STATUS":
      return { ...state, subscriptionStatus: action.payload };
    default:
      return state;
  }
};

const AppContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => null });

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(AppReducer, initialState);

  // Add this effect to initialize state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("appState");
    if (savedState) {
      dispatch({ type: "INITIALIZE_STATE", payload: JSON.parse(savedState) });
    }
  }, []);

  // Add this effect to save state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("appState", JSON.stringify(state));
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};
