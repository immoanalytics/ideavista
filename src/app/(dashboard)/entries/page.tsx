"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Lightbulb, Bell, Plane, CheckSquare, FileText, Bookmark, BookOpen, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { formatRelativeTime, getEntryTypeColor } from "@/lib/utils";
import { ENTRY_TYPES } from "@/lib/constants";
import { toast } from "sonner";

const typeIcons: Record<string, React.ComponentType<any>> = {
  IDEA: Lightbulb, REMINDER: Bell, TRIP: Plane, TASK: CheckSquare,
  NOTE: FileText, BOOKMARK: Bookmark, JOURNAL: BookOpen,
};

export default function EntriesPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const utils = trpc.useUtils();

  const entries = trpc.entry.list.useQuery({
    search: search || undefined,
    type: typeFilter || undefined,
    limit: 50,
  });

  const deleteEntry = trpc.entry.delete.useMutation({
    onSuccess: () => {
      utils.entry.list.invalidate();
      utils.entry.stats.invalidate();
      toast.success("Entry deleted");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Entries</h1>
        <Button asChild>
          <Link href="/entries/new"><Plus className="h-4 w-4 mr-2" />New Entry</Link>
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search entries..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {ENTRY_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {entries.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : entries.data?.entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No entries found. Create your first one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {entries.data?.entries.map((entry) => {
            const Icon = typeIcons[entry.type] ?? FileText;
            return (
              <Card key={entry.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 mt-0.5 shrink-0" style={{ color: getEntryTypeColor(entry.type) }} />
                    <Link href={`/entries/${entry.id}`} className="flex-1 min-w-0">
                      <h3 className="font-medium">{entry.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {entry.summary ?? entry.content.slice(0, 200)}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {entry.type.charAt(0) + entry.type.slice(1).toLowerCase()}
                        </Badge>
                        {entry.aiCategory && (
                          <Badge variant="outline" className="text-xs" style={{ borderColor: entry.aiCategory.color ?? undefined }}>
                            {entry.aiCategory.name}
                          </Badge>
                        )}
                        {entry.tags.slice(0, 3).map((t) => (
                          <Badge key={t.tag.id} variant="outline" className="text-xs">
                            {t.tag.name}
                          </Badge>
                        ))}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatRelativeTime(entry.createdAt)}
                        </span>
                      </div>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        if (confirm("Delete this entry?")) {
                          deleteEntry.mutate({ id: entry.id });
                        }
                      }}
                      disabled={deleteEntry.isPending}
                    >
                      {deleteEntry.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
