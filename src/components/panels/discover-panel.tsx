"use client";

import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Compass, Sparkles, Layers } from "lucide-react";
import { cn, formatRelativeTime, getEntryTypeColor } from "@/lib/utils";

interface DiscoverPanelProps {
  onOpenEntry: (id: string) => void;
}

// Gradient backgrounds for entries without OG images
const GRADIENT_PALETTES: Record<string, string> = {
  "#8B5CF6": "from-violet-600/80 to-indigo-900/90",
  "#F59E0B": "from-amber-500/80 to-orange-800/90",
  "#10B981": "from-emerald-500/80 to-teal-900/90",
  "#3B82F6": "from-blue-500/80 to-sky-900/90",
  "#EC4899": "from-pink-500/80 to-rose-900/90",
  "#F97316": "from-orange-500/80 to-red-900/90",
  "#6B7280": "from-gray-500/80 to-slate-800/90",
  "#06B6D4": "from-cyan-500/80 to-blue-900/90",
  "#EF4444": "from-red-500/80 to-rose-900/90",
};

function getGradient(color: string | null): string {
  if (color && GRADIENT_PALETTES[color]) return GRADIENT_PALETTES[color];
  const keys = Object.keys(GRADIENT_PALETTES);
  const idx = color
    ? Math.abs(color.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) %
      keys.length
    : 0;
  return GRADIENT_PALETTES[keys[idx]];
}

/* ── Category Chip Bar ─────────────────────────────── */

function CategoryChips({
  categories,
  selected,
  totalCount,
  onSelect,
}: {
  categories: Array<{
    id: string;
    name: string;
    color: string | null;
    entryCount: number;
  }>;
  selected: string | null;
  totalCount: number;
  onSelect: (id: string | null) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-1 px-4 no-scrollbar"
      style={{ touchAction: "pan-x", WebkitOverflowScrolling: "touch" }}
    >
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5",
          !selected
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
      >
        All
        <span className={cn(
          "text-[10px] tabular-nums",
          !selected ? "text-primary-foreground/70" : "text-muted-foreground/60"
        )}>
          {totalCount}
        </span>
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id === selected ? null : cat.id)}
          className={cn(
            "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5",
            selected === cat.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {cat.name}
          <span className={cn(
            "text-[10px] tabular-nums",
            selected === cat.id ? "text-primary-foreground/70" : "text-muted-foreground/60"
          )}>
            {cat.entryCount}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ── Image URL helper ─────────────────────────────── */

function getImageUrl(entry: any, size = "600x400"): string | null {
  if (entry.image) return entry.image;
  if (entry.imageKeyword) {
    return `https://source.unsplash.com/${size}/?${encodeURIComponent(entry.imageKeyword)}`;
  }
  return null;
}

/** Display title with fallback to truncated content */
function displayTitle(entry: any): string {
  if (entry.title) return entry.title;
  const text = entry.summary ?? entry.content ?? "";
  return text.slice(0, 60).trim() + (text.length > 60 ? "..." : "") || "Untitled";
}

/* ── Featured Card (hero size) ────────────────────── */

function FeaturedCard({
  entry,
  onClick,
  moreCount,
}: {
  entry: any;
  onClick: () => void;
  moreCount?: number;
}) {
  const imageUrl = getImageUrl(entry, "800x500");
  const hasImage = !!imageUrl;
  const gradient = getGradient(entry.categoryColor);

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl overflow-hidden shadow-sm transition-all duration-200 active:scale-[0.98] hover:shadow-md"
    >
      {/* Hero area */}
      <div
        className={cn(
          "relative w-full aspect-[16/10] overflow-hidden",
          !hasImage && `bg-gradient-to-br ${gradient}`
        )}
      >
        {hasImage && (
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
        {!hasImage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="h-10 w-10 text-white/20" />
          </div>
        )}
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Title over image */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {entry.categoryName && (
            <span
              className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide mb-2"
              style={{
                backgroundColor: entry.categoryColor ?? "#6B7280",
                color: "#fff",
              }}
            >
              {entry.categoryName}
            </span>
          )}
          <h3 className="text-white font-bold text-lg leading-tight line-clamp-2">
            {displayTitle(entry)}
          </h3>
        </div>

        {/* "More in this category" badge */}
        {moreCount != null && moreCount > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-1 rounded-full">
            <Layers className="h-3 w-3" />
            +{moreCount} more
          </div>
        )}
      </div>

      {/* Body */}
      <div className="bg-card p-4 border border-t-0 border-border/50 rounded-b-2xl">
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {entry.summary ?? entry.content}
        </p>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {entry.type && (
            <Badge
              variant="secondary"
              className="text-xs h-5"
              style={{ color: getEntryTypeColor(entry.type) }}
            >
              {entry.type.charAt(0) + entry.type.slice(1).toLowerCase()}
            </Badge>
          )}
          {entry.tags?.slice(0, 3).map((tag: string) => (
            <Badge key={tag} variant="outline" className="text-xs h-5">
              {tag}
            </Badge>
          ))}
          <span className="text-xs text-muted-foreground ml-auto">
            {formatRelativeTime(entry.createdAt)}
          </span>
        </div>
      </div>
    </button>
  );
}

/* ── Wide Card (alternates with compact for visual variety) */

function WideCard({
  entry,
  onClick,
  moreCount,
}: {
  entry: any;
  onClick: () => void;
  moreCount?: number;
}) {
  const imageUrl = getImageUrl(entry, "600x300");
  const hasImage = !!imageUrl;
  const gradient = getGradient(entry.categoryColor);

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl overflow-hidden shadow-sm border border-border/50 bg-card transition-all duration-200 active:scale-[0.98] hover:shadow-md"
    >
      {/* Wide image banner */}
      <div
        className={cn(
          "relative w-full aspect-[21/9] overflow-hidden",
          !hasImage && `bg-gradient-to-br ${gradient}`
        )}
      >
        {hasImage ? (
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Sparkles className="h-6 w-6 text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        {entry.categoryName && (
          <span
            className="absolute bottom-2 left-3 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide"
            style={{
              backgroundColor: entry.categoryColor ?? "#6B7280",
              color: "#fff",
            }}
          >
            {entry.categoryName}
          </span>
        )}
        {moreCount != null && moreCount > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
            <Layers className="h-2.5 w-2.5" />
            +{moreCount}
          </div>
        )}
      </div>
      <div className="p-3">
        <h4 className="font-semibold text-sm leading-tight line-clamp-1">
          {displayTitle(entry)}
        </h4>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
          {entry.summary ?? entry.content}
        </p>
        <div className="flex items-center gap-1.5 mt-2">
          {entry.tags?.slice(0, 3).map((tag: string) => (
            <Badge key={tag} variant="outline" className="text-[10px] h-4">
              {tag}
            </Badge>
          ))}
          <span className="text-[10px] text-muted-foreground ml-auto">
            {formatRelativeTime(entry.createdAt)}
          </span>
        </div>
      </div>
    </button>
  );
}

/* ── Compact Card (horizontal thumbnail + text) ──── */

function CompactCard({
  entry,
  onClick,
  moreCount,
}: {
  entry: any;
  onClick: () => void;
  moreCount?: number;
}) {
  const imageUrl = getImageUrl(entry);
  const hasImage = !!imageUrl;
  const gradient = getGradient(entry.categoryColor);

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl overflow-hidden shadow-sm border border-border/50 bg-card transition-all duration-200 active:scale-[0.98] hover:shadow-md flex h-28"
    >
      {/* Thumbnail */}
      <div
        className={cn(
          "w-28 shrink-0 relative overflow-hidden",
          !hasImage && `bg-gradient-to-br ${gradient}`
        )}
      >
        {hasImage ? (
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Sparkles className="h-5 w-5 text-white/30" />
          </div>
        )}
        {moreCount != null && moreCount > 0 && (
          <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/50 backdrop-blur-sm text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full">
            <Layers className="h-2.5 w-2.5" />
            +{moreCount}
          </div>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 p-3 min-w-0 flex flex-col">
        {entry.categoryName && (
          <span
            className="inline-block self-start px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide mb-1"
            style={{
              backgroundColor: entry.categoryColor ?? "#6B7280",
              color: "#fff",
            }}
          >
            {entry.categoryName}
          </span>
        )}
        <h4 className="font-semibold text-sm leading-tight line-clamp-2">
          {displayTitle(entry)}
        </h4>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed flex-1">
          {entry.summary ?? entry.content}
        </p>
        <div className="flex items-center gap-1.5 mt-auto">
          {entry.tags?.slice(0, 2).map((tag: string) => (
            <Badge key={tag} variant="outline" className="text-[10px] h-4">
              {tag}
            </Badge>
          ))}
          <span className="text-[10px] text-muted-foreground ml-auto">
            {formatRelativeTime(entry.createdAt)}
          </span>
        </div>
      </div>
    </button>
  );
}

/* ── Main Panel ────────────────────────────────────── */

export function DiscoverPanel({ onOpenEntry }: DiscoverPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    null
  );

  const feed = trpc.discover.feed.useQuery(
    { categoryId: selectedCategory ?? undefined },
    { retry: 2 }
  );

  /* Loading skeleton */
  if (feed.isLoading) {
    return (
      <div className="h-full overflow-y-auto pt-10 pb-4 space-y-4">
        <div className="flex items-center gap-2 px-4">
          <Compass className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Discover</h1>
        </div>
        <div className="flex gap-2 px-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full shrink-0" />
          ))}
        </div>
        <div className="px-4 space-y-4">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  /* Error state */
  if (feed.isError) {
    return (
      <div className="h-full overflow-y-auto pt-10 pb-4 space-y-4">
        <div className="flex items-center gap-2 px-4">
          <Compass className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Discover</h1>
        </div>
        <div className="text-center py-16 text-muted-foreground">
          <Compass className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm">Could not load discoveries</p>
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
  const entries = data?.entries ?? [];
  const categories = data?.categories ?? [];
  const totalCount = data?.totalCount ?? entries.length;

  // In "All" view, entries are already deduplicated by category from the backend.
  // Pick the entry with the most tags as the featured card.
  const sortedByRichness = [...entries].sort(
    (a, b) => (b.tags?.length ?? 0) - (a.tags?.length ?? 0)
  );
  const featured = sortedByRichness[0];
  const rest = featured
    ? entries.filter((e) => e.id !== featured.id)
    : [];

  return (
    <div className="h-full overflow-y-auto pt-10 pb-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 mb-3">
        <Compass className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Discover</h1>
      </div>

      {/* Scrollable category chips */}
      {categories.length > 0 && (
        <div className="mb-4">
          <CategoryChips
            categories={categories}
            selected={selectedCategory}
            totalCount={totalCount}
            onSelect={setSelectedCategory}
          />
        </div>
      )}

      {/* Cards */}
      {entries.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground px-4">
          <Compass className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No discoveries yet</p>
          <p className="text-sm mt-1">Swipe right to catch your first idea</p>
        </div>
      ) : (
        <div className="px-4 space-y-4 pb-8">
          {/* Hero card — most "rich" entry */}
          {featured && (
            <FeaturedCard
              entry={featured}
              onClick={() => onOpenEntry(featured.id)}
              moreCount={featured.moreInCategory}
            />
          )}

          {/* Mixed layout: alternate wide and compact for variety */}
          {rest.map((entry, i) =>
            i % 3 === 1 ? (
              <WideCard
                key={entry.id}
                entry={entry}
                onClick={() => onOpenEntry(entry.id)}
                moreCount={entry.moreInCategory}
              />
            ) : (
              <CompactCard
                key={entry.id}
                entry={entry}
                onClick={() => onOpenEntry(entry.id)}
                moreCount={entry.moreInCategory}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
