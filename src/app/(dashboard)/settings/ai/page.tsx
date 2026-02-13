"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Brain, Key, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { AI_PROVIDERS } from "@/lib/constants";
import { toast } from "sonner";

export default function AISettingsPage() {
  const [provider, setProvider] = useState("OPENAI");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [embedModel, setEmbedModel] = useState("");
  const utils = trpc.useUtils();

  const aiConfig = trpc.settings.getAiConfig.useQuery();
  const updateConfig = trpc.settings.updateAiConfig.useMutation({
    onSuccess: () => {
      utils.settings.getAiConfig.invalidate();
      toast.success("AI configuration saved!");
      setApiKey("");
    },
    onError: (err) => toast.error(err.message),
  });

  const selectedProvider = AI_PROVIDERS.find((p) => p.value === provider);

  useEffect(() => {
    if (aiConfig.data) {
      setProvider(aiConfig.data.provider);
      setModel(aiConfig.data.model);
      setEmbedModel(aiConfig.data.embedModel);
    }
  }, [aiConfig.data]);

  useEffect(() => {
    if (selectedProvider) {
      const models = selectedProvider.models as readonly string[];
      if (!model || !models.includes(model)) {
        setModel(models[0]);
      }
      const embedModels = selectedProvider.embedModels as readonly string[];
      if (embedModels.length > 0) {
        if (!embedModel || !embedModels.includes(embedModel)) {
          setEmbedModel(embedModels[0] ?? "");
        }
      }
    }
  }, [provider]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">AI Configuration</h1>
      </div>

      {aiConfig.data && (
        <Card className="border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Check className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-sm">AI is configured</p>
              <p className="text-xs text-muted-foreground">
                Provider: {aiConfig.data.provider} &middot; Model: {aiConfig.data.model} &middot; Key: {aiConfig.data.apiKey}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" /> AI Provider</CardTitle>
          <CardDescription>
            Configure your preferred AI provider. Your API key is encrypted and stored securely.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_PROVIDERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Key className="h-3.5 w-3.5" /> API Key
            </Label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={aiConfig.data ? "Enter new key to update" : "Enter your API key"}
            />
          </div>

          <div className="space-y-2">
            <Label>Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {selectedProvider?.models.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProvider && selectedProvider.embedModels.length > 0 && (
            <div className="space-y-2">
              <Label>Embedding Model</Label>
              <Select value={embedModel} onValueChange={setEmbedModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectedProvider.embedModels.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            onClick={() => {
              if (!apiKey && !aiConfig.data) {
                toast.error("Please enter your API key");
                return;
              }
              updateConfig.mutate({
                provider: provider as any,
                apiKey: apiKey || "keep-existing",
                model,
                embedModel: embedModel || "text-embedding-3-small",
              });
            }}
            disabled={updateConfig.isPending}
            className="w-full"
          >
            {updateConfig.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Configuration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
