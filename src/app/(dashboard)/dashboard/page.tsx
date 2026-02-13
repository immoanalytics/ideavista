"use client";

import Link from "next/link";
import { Lightbulb, Bell, Plane, CheckSquare, FileText, Bookmark, BookOpen, Plus, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { formatRelativeTime, getEntryTypeColor } from "@/lib/utils";

const typeIcons: Record<string, React.ComponentType<any>> = {
  IDEA: Lightbulb,
  REMINDER: Bell,
  TRIP: Plane,
  TASK: CheckSquare,
  NOTE: FileText,
  BOOKMARK: Bookmark,
  JOURNAL: BookOpen,
};

export default function DashboardPage() {
  const stats = trpc.entry.stats.useQuery();
  const entries = trpc.entry.list.useQuery({ limit: 10 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your ideas at a glance</p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/entries/new"><Plus className="h-4 w-4 mr-2" />New Entry</Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Entries</p>
                <p className="text-3xl font-bold">{stats.data?.total ?? 0}</p>
              </CardContent>
            </Card>
            {stats.data?.byType.slice(0, 3).map((item) => {
              const Icon = typeIcons[item.type] ?? FileText;
              return (
                <Card key={item.type}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" style={{ color: getEntryTypeColor(item.type) }} />
                      <p className="text-sm text-muted-foreground">{item.type.charAt(0) + item.type.slice(1).toLowerCase()}s</p>
                    </div>
                    <p className="text-3xl font-bold">{item._count}</p>
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}
      </div>

      {/* Recent Entries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Entries</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/entries">View all <ArrowRight className="h-4 w-4 ml-1" /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          {entries.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : entries.data?.entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No entries yet. Capture your first idea!</p>
              <Button className="mt-4" asChild>
                <Link href="/entries/new"><Plus className="h-4 w-4 mr-2" />Create Entry</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.data?.entries.map((entry) => {
                const Icon = typeIcons[entry.type] ?? FileText;
                return (
                  <Link
                    key={entry.id}
                    href={`/entries/${entry.id}`}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Icon className="h-5 w-5 shrink-0 mt-0.5" style={{ color: getEntryTypeColor(entry.type) }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 justify-between">
                        <p className="font-medium truncate">{entry.title}</p>
                        <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">{formatRelativeTime(entry.createdAt)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{entry.summary ?? entry.content.slice(0, 100)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {entry.type.charAt(0) + entry.type.slice(1).toLowerCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground sm:hidden">{formatRelativeTime(entry.createdAt)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
