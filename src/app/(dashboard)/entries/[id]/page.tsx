"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit2, Save, X, Trash2, Sparkles, Loader2, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { formatDate, getEntryTypeColor } from "@/lib/utils";
import { toast } from "sonner";

export default function EntryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const utils = trpc.useUtils();

  const entry = trpc.entry.getById.useQuery({ id });

  // Sync form state when data loads
  const entryData = entry.data;
  if (entryData && !title && !editing) {
    setTitle(entryData.title);
    setContent(entryData.content);
  }

  const updateEntry = trpc.entry.update.useMutation({
    onSuccess: () => {
      utils.entry.getById.invalidate({ id });
      utils.entry.list.invalidate();
      setEditing(false);
      toast.success("Entry updated");
    },
  });

  const deleteEntry = trpc.entry.delete.useMutation({
    onSuccess: () => {
      utils.entry.list.invalidate();
      router.push("/entries");
      toast.success("Entry deleted");
    },
  });

  const processEntry = trpc.ai.processEntry.useMutation({
    onSuccess: () => {
      utils.entry.getById.invalidate({ id });
      utils.entry.list.invalidate();
      utils.graph.getFullGraph.invalidate();
      toast.success("AI analysis complete!");
    },
    onError: (err) => toast.error(err.message),
  });

  if (entry.isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!entry.data) {
    return <div className="text-center py-12 text-muted-foreground">Entry not found</div>;
  }

  const e = entry.data;
  const relatedEntries = [
    ...e.edgesFrom.map((edge) => ({ ...edge.target, relationship: edge.relationship, strength: edge.strength })),
    ...e.edgesTo.map((edge) => ({ ...edge.source, relationship: edge.relationship, strength: edge.strength })),
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/entries"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold flex-1">{editing ? "Edit Entry" : e.title}</h1>
        <div className="flex gap-2">
          {!editing && (
            <>
              <Button variant="outline" size="sm" onClick={() => processEntry.mutate({ entryId: id })} disabled={processEntry.isPending}>
                {processEntry.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span className="hidden sm:inline ml-1">Analyze</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="text-destructive" onClick={() => {
                if (confirm("Delete this entry?")) deleteEntry.mutate({ id });
              }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {editing ? (
            <div className="space-y-4">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} />
              <div className="flex gap-2">
                <Button onClick={() => updateEntry.mutate({ id, title, content })} disabled={updateEntry.isPending}>
                  {updateEntry.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </Button>
                <Button variant="outline" onClick={() => { setEditing(false); setTitle(e.title); setContent(e.content); }}>
                  <X className="h-4 w-4" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge style={{ backgroundColor: getEntryTypeColor(e.type), color: "white" }}>
                  {e.type.charAt(0) + e.type.slice(1).toLowerCase()}
                </Badge>
                {e.aiCategory && (
                  <Badge variant="outline" style={{ borderColor: e.aiCategory.color ?? undefined }}>
                    {e.aiCategory.name}
                  </Badge>
                )}
                {e.tags.map((t) => (
                  <Badge key={t.tag.id} variant="secondary" className="text-xs">{t.tag.name}</Badge>
                ))}
              </div>

              {e.summary && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm font-medium text-muted-foreground mb-1">AI Summary</p>
                  <p className="text-sm">{e.summary}</p>
                </div>
              )}

              <div className="whitespace-pre-wrap">{e.content}</div>

              <p className="text-xs text-muted-foreground">Created {formatDate(e.createdAt)} &middot; Updated {formatDate(e.updatedAt)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Related Entries */}
      {relatedEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Network className="h-4 w-4" /> Related Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {relatedEntries.map((rel: any) => (
                <Link
                  key={rel.id}
                  href={`/entries/${rel.id}`}
                  className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium text-sm">{rel.title}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{rel.relationship}</Badge>
                    <span className="text-xs text-muted-foreground">{Math.round(rel.strength * 100)}%</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
