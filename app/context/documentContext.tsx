"use client";

import React, { createContext, useContext, useReducer, Dispatch } from "react";

interface Document {
  id: string;
  title: string;
  content: string;
  conversation: string[];
}

interface DocumentState {
  documents: Document[];
  selectedDocument: Document | null;
}

type DocumentAction =
  | { type: "SET_DOCUMENTS"; payload: Document[] }
  | { type: "UPDATE_DOCUMENT"; payload: Document }
  | { type: "SELECT_DOCUMENT"; payload: Document | null };

const initialState: DocumentState = {
  documents: [],
  selectedDocument: null,
};

function documentReducer(
  state: DocumentState,
  action: DocumentAction
): DocumentState {
  switch (action.type) {
    case "SET_DOCUMENTS":
      return { ...state, documents: action.payload };
    case "UPDATE_DOCUMENT":
      return {
        ...state,
        documents: state.documents.map((doc) =>
          doc.id === action.payload.id ? action.payload : doc
        ),
        selectedDocument:
          state.selectedDocument?.id === action.payload.id
            ? action.payload
            : state.selectedDocument,
      };
    case "SELECT_DOCUMENT":
      return { ...state, selectedDocument: action.payload };
    default:
      return state;
  }
}

const DocumentContext = createContext<
  | {
      state: DocumentState;
      dispatch: Dispatch<DocumentAction>;
    }
  | undefined
>(undefined);

export function useDocuments() {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error("useDocuments must be used within a DocumentProvider");
  }
  return context;
}

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(documentReducer, initialState);

  return (
    <DocumentContext.Provider value={{ state, dispatch }}>
      {children}
    </DocumentContext.Provider>
  );
}
