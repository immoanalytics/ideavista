"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GuestButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGuest = async () => {
    setLoading(true);
    try {
      await fetch("/api/guest", { method: "POST" });
      router.push("/dashboard");
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGuest}
      disabled={loading}
      className="inline-flex items-center gap-2 border border-input bg-background px-8 py-3 rounded-lg text-lg font-medium hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
    >
      {loading ? "Loading..." : "Try as Guest"}
    </button>
  );
}
