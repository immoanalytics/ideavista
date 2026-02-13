"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ENTRY_TYPES } from "@/lib/constants";
import { toast } from "sonner";

export default function NewEntryPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<string>("");
  const utils = trpc.useUtils();

  const createEntry = trpc.entry.create.useMutation({
    onSuccess: (entry) => {
      utils.entry.list.invalidate();
      utils.entry.stats.invalidate();
      toast.success("Entry created!");
      // Trigger AI processing in the background
      processEntry.mutate({ entryId: entry.id });
      router.push(`/entries/${entry.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const processEntry = trpc.ai.processEntry.useMutation({
    onSuccess: () => {
      utils.entry.list.invalidate();
      utils.entry.stats.invalidate();
      utils.graph.getFullGraph.invalidate();
      toast.success("AI analysis complete!");
    },
    onError: () => {
      // Silently handle - AI processing is optional
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createEntry.mutate({
      title,
      content,
      ...(type && type !== "auto" ? { type: type as any } : {}),
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/entries"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">New Entry</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Capture your thought
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="What's on your mind?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Describe your idea, reminder, trip plan, or anything else..."
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type (optional - AI will auto-detect)</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Auto-detect with AI" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect with AI</SelectItem>
                  {ENTRY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={createEntry.isPending} className="flex-1">
                {createEntry.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Entry
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/entries">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
