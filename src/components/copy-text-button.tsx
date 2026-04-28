"use client";

import { useState } from "react";

interface CopyTextButtonProps {
  text: string;
  label?: string;
}

export function CopyTextButton({ text, label = "Copy" }: CopyTextButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch (error) {
      console.error("Failed to copy text", error);
      setStatus("error");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-white/40"
      aria-live="polite"
    >
      {status === "copied" ? "Copied" : status === "error" ? "Error" : label}
    </button>
  );
}
