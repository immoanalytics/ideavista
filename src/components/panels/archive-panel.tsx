"use client";

import { useState } from "react";
import { Search, BookOpen, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { cn, formatRelativeTime, getEntryTypeColor } from "@/lib/utils";

const ENTRY_TYPES = ["all", "NOTE", "IDEA", "REMINDER", "TRIP", "TASK", "BOOKMARK", "JOURNAL"] as const;

interface ArchivePanelProps {
  onOpenEntry: (id: string) => void;
}

export function ArchivePanel({ onOpenEntry }: ArchivePanelProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const entries = trpc.entry.list.useQuery({
    limit: 100,
    search: search || undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
  });

  const stats = trpc.entry.stats.useQuery();

  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Header */}
      <div className="px-4 pt-10 pb-3 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Idea Book</h1>
          {stats.data && (
            <span className="text-xs text-muted-foreground ml-auto">
              {stats.data.total} ideas
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ideas..."
            className="w-full rounded-xl border border-border/60 bg-card pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 placeholder:text-muted-foreground/60"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Type filter chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {ENTRY_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                typeFilter === type
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {type === "all" ? "All" : type.charAt(0) + type.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Entry list */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
        {entries.isLoading ? (
          <div className="space-y-3 mt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl bg-muted h-20" />
            ))}
          </div>
        ) : entries.data?.entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">
              {search ? "No ideas match your search" : "No ideas yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-2 mt-1">
            {entries.data?.entries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => onOpenEntry(entry.id)}
                className="w-full text-left rounded-xl border border-border/50 bg-card p-3.5 transition-all hover:bg-accent/50 active:scale-[0.98]"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm line-clamp-1">{entry.title}</p>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {formatRelativeTime(entry.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                  {entry.summary ?? entry.content.slice(0, 120)}
                </p>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {entry.type && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-4 px-1.5"
                      style={{ color: getEntryTypeColor(entry.type) }}
                    >
                      {entry.type.charAt(0) + entry.type.slice(1).toLowerCase()}
                    </Badge>
                  )}
                  {entry.tags?.slice(0, 3).map((t) => (
                    <Badge
                      key={t.tag.id}
                      variant="outline"
                      className="text-[10px] h-4 px-1.5"
                    >
                      {t.tag.name}
                    </Badge>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
