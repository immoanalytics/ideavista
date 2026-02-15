"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Settings, Loader2, Check, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface InputPanelProps {
  onOpenSettings: () => void;
  onOpenEntry: (id: string) => void;
}


export function InputPanel({ onOpenSettings }: InputPanelProps) {
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const utils = trpc.useUtils();

  const createEntry = trpc.entry.create.useMutation({
    onSuccess: () => {
      setSaved(true);
      utils.entry.list.invalidate();
      utils.entry.stats.invalidate();
      utils.discover.feed.invalidate();
      setTimeout(() => {
        setSaved(false);
        textareaRef.current?.focus();
      }, 1500);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  function handleSubmit() {
    const trimmed = content.trim();
    if (!trimmed || createEntry.isPending) return;
    setContent("");
    createEntry.mutate({ content: trimmed });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  }, [content]);

  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Settings gear — top right */}
      <div className="flex justify-end px-4 pt-10 shrink-0">
        <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={onOpenSettings}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Main content — positioned in upper-center like Perplexity */}
      <div className="flex-1 flex flex-col items-center justify-start px-6 pt-[18vh]">
        {/* Brand — tapping anywhere here focuses the input (opens keyboard on mobile) */}
        <div
          className="flex flex-col items-center cursor-text"
          onClick={() => textareaRef.current?.focus()}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <Sparkles className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">IdeaVista</h1>
          </div>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Capture anything. Discover everything.
          </p>
        </div>

        {/* Input bar */}
        <div className="w-full max-w-md">
          <div className="relative flex items-end rounded-2xl border border-border/60 bg-card shadow-sm focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/40">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What's on your mind?"
              autoFocus
              rows={1}
              className="flex-1 resize-none bg-transparent px-4 py-3 pr-2 text-sm focus:outline-none placeholder:text-muted-foreground/60"
              style={{ maxHeight: 120 }}
            />
            <Button
              size="icon"
              className="rounded-full h-8 w-8 m-1.5 shrink-0 transition-all duration-200 active:scale-90"
              onClick={handleSubmit}
              disabled={!content.trim() || createEntry.isPending}
            >
              {createEntry.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Saved confirmation */}
          {saved && (
            <div className="flex items-center justify-center gap-1.5 mt-4 text-sm text-primary animate-fade-in">
              <Check className="h-4 w-4" />
              <span>Idea saved</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
