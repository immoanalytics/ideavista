"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Plane,
  Film,
  BookOpen,
  MoreHorizontal,
  FolderOpen,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DiscoverPanelProps {
  onOpenEntry: (id: string) => void;
}

/* ── Category config ──────────────────────────────── */

const CATEGORY_META: Record<
  string,
  {
    icon: React.ElementType;
    gradient: string;
    accent: string;
    bg: string;
    ring: string;
  }
> = {
  Trips: {
    icon: Plane,
    gradient: "from-emerald-500/15 to-teal-600/5",
    accent: "text-emerald-400",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/20",
  },
  Entertainment: {
    icon: Film,
    gradient: "from-violet-500/15 to-purple-600/5",
    accent: "text-violet-400",
    bg: "bg-violet-500/10",
    ring: "ring-violet-500/20",
  },
  "To Read": {
    icon: BookOpen,
    gradient: "from-blue-500/15 to-sky-600/5",
    accent: "text-blue-400",
    bg: "bg-blue-500/10",
    ring: "ring-blue-500/20",
  },
  Other: {
    icon: MoreHorizontal,
    gradient: "from-gray-500/15 to-slate-600/5",
    accent: "text-gray-400",
    bg: "bg-gray-500/10",
    ring: "ring-gray-500/20",
  },
};

function getCategoryMeta(name: string) {
  return (
    CATEGORY_META[name] ?? {
      icon: MoreHorizontal,
      gradient: "from-gray-500/15 to-slate-600/5",
      accent: "text-gray-400",
      bg: "bg-gray-500/10",
      ring: "ring-gray-500/20",
    }
  );
}

/** Format date as DD/MM */
function shortDate(d: Date | string): string {
  const date = new Date(d);
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Derive a short "item" label from the entry */
function itemLabel(entry: any): string {
  if (entry.title) return entry.title;
  const text = entry.summary ?? entry.content ?? "";
  return text.slice(0, 50).trim() + (text.length > 50 ? "…" : "") || "Untitled";
}

/* ── Collapsible Category Section ──────────────────── */

function CategoryAccordion({
  name,
  entries,
  expanded,
  onToggle,
  onOpenEntry,
}: {
  name: string;
  entries: any[];
  expanded: boolean;
  onToggle: () => void;
  onOpenEntry: (id: string) => void;
}) {
  const meta = getCategoryMeta(name);
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/40 overflow-hidden transition-all",
        expanded && `bg-gradient-to-b ${meta.gradient}`
      )}
    >
      {/* Accordion trigger */}
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3.5 transition-colors",
          !expanded && "hover:bg-muted/40"
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center h-8 w-8 rounded-lg ring-1",
            meta.bg,
            meta.ring,
            meta.accent
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold flex-1 text-left">{name}</span>
        <Badge
          variant="secondary"
          className="text-[10px] h-5 tabular-nums mr-1"
        >
          {entries.length}
        </Badge>
        <ChevronRight
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            expanded && "rotate-90"
          )}
        />
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-3">
          {entries.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-xs">
              No entries yet
            </div>
          ) : (
            <div className="rounded-xl border border-border/30 bg-card/70 backdrop-blur-sm overflow-hidden">
              {entries.map((entry, i) => (
                <button
                  key={entry.id}
                  onClick={() => onOpenEntry(entry.id)}
                  className={cn(
                    "w-full text-left flex items-start gap-3 px-3 py-2.5 transition-colors hover:bg-muted/40 active:bg-muted/60",
                    i < entries.length - 1 && "border-b border-border/20"
                  )}
                >
                  <span className="text-[11px] text-muted-foreground tabular-nums pt-0.5 shrink-0 w-[38px]">
                    {shortDate(entry.createdAt)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight line-clamp-1">
                      {itemLabel(entry)}
                    </p>
                    {entry.tags?.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {entry.tags.slice(0, 2).map((tag: string) => (
                          <span
                            key={tag}
                            className="text-[9px] text-muted-foreground bg-muted/60 rounded px-1 py-0.5"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 pt-0.5 max-w-[40%] shrink-0 hidden sm:block">
                    {entry.summary ?? entry.content}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Panel ────────────────────────────────────── */

const CATEGORY_ORDER = ["Trips", "Entertainment", "To Read", "Other"];

export function DiscoverPanel({ onOpenEntry }: DiscoverPanelProps) {
  const feed = trpc.discover.feed.useQuery(undefined, { retry: 2 });
  const [expanded, setExpanded] = useState<Set<string>>(new Set(CATEGORY_ORDER));

  const toggleCategory = (cat: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  /* Loading skeleton */
  if (feed.isLoading) {
    return (
      <div className="h-full overflow-y-auto pt-12 pb-4 space-y-4">
        <div className="flex items-center gap-2 px-4">
          <FolderOpen className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Digital Dashboard</h1>
        </div>
        <div className="px-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  /* Error state */
  if (feed.isError) {
    return (
      <div className="h-full overflow-y-auto pt-12 pb-4 space-y-4">
        <div className="flex items-center gap-2 px-4">
          <FolderOpen className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Digital Dashboard</h1>
        </div>
        <div className="text-center py-16 text-muted-foreground">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm">Could not load dashboard</p>
          <button
            onClick={() => feed.refetch()}
            className="text-sm text-primary mt-2 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const data = feed.data;
  const allEntries = data?.entries ?? [];

  // Group entries by category name
  const grouped: Record<string, any[]> = {};
  for (const cat of CATEGORY_ORDER) {
    grouped[cat] = [];
  }
  for (const entry of allEntries) {
    const catName = entry.categoryName ?? "Other";
    if (!grouped[catName]) grouped[catName] = [];
    grouped[catName].push(entry);
  }

  // Also collect any dynamic categories not in the fixed list
  const dynamicCategories = Object.keys(grouped).filter(
    (c) => !CATEGORY_ORDER.includes(c)
  );
  const allCategories = [...CATEGORY_ORDER, ...dynamicCategories];

  const hasEntries = allEntries.length > 0;

  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Header */}
      <div className="px-4 pt-10 pb-2 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <FolderOpen className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Digital Dashboard</h1>
          <span className="text-xs text-muted-foreground ml-auto tabular-nums">
            {allEntries.length} ideas
          </span>
        </div>
        {hasEntries && (
          <p className="text-[11px] text-muted-foreground/60 px-0.5">
            AI-organized across {allCategories.filter((c) => (grouped[c]?.length ?? 0) > 0).length} categories
          </p>
        )}
      </div>

      {/* Scrollable category list */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6">
        {!hasEntries ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">
              No ideas yet &mdash; swipe right to catch your first
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 mt-2">
            {allCategories.map((cat) => (
              <CategoryAccordion
                key={cat}
                name={cat}
                entries={grouped[cat] ?? []}
                expanded={expanded.has(cat)}
                onToggle={() => toggleCategory(cat)}
                onOpenEntry={onOpenEntry}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
