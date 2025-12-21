"use client";

import { useEffect } from "react";
import { notify } from "@/lib/notifications";

export type Message =
  | { success: string }
  | { error: string }
  | { message: string };

export function FormMessage({ message }: { message: Message }) {
  useEffect(() => {
    if ("success" in message) {
      notify.success("Success", message.success);
    } else if ("error" in message) {
      notify.error("Error", message.error);
    } else if ("message" in message) {
      notify.info("Note", message.message);
    }
  }, [message]);

  return (
    <div className="flex flex-col gap-2 w-full max-w-md text-sm">
      {"success" in message && (
        <div className="text-success border-l-2 border-success px-4 py-1 bg-success/5 font-medium">
          {message.success}
        </div>
      )}
      {"error" in message && (
        <div className="text-error border-l-2 border-error px-4 py-1 bg-error/5 font-medium">
          {message.error}
        </div>
      )}
      {"message" in message && (
        <div className="text-charcoal border-l-2 border-gold px-4 py-1 bg-gold/5 font-medium">
          {message.message}
        </div>
      )}
    </div>
  );
}

