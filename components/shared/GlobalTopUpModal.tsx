"use client";
import { useAppContext } from "@/app/context/appContext";
import { TopUpModal } from "./topUpModal";

export function GlobalTopUpModal() {
  const { state, dispatch } = useAppContext();

  return (
    <TopUpModal
      isOpen={state.showTopup}
      onClose={() => dispatch({ type: "SET_SHOW_TOPUP_MODAL", payload: false })}
      userId={state.user?.id}
    />
  );
}
