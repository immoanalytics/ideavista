"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogOut, Brain, Check, Key } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AI_PROVIDERS } from "@/lib/constants";
import { toast } from "sonner";

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsSheet({ open, onClose }: SettingsSheetProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const utils = trpc.useUtils();

  const isGuest = !session?.user;

  // Profile
  const profile = trpc.settings.getProfile.useQuery();
  const [name, setName] = useState("");
  const updateProfile = trpc.settings.updateProfile.useMutation({
    onSuccess: () => {
      utils.settings.getProfile.invalidate();
      toast.success("Profile updated");
    },
  });

  useEffect(() => {
    if (profile.data?.name) setName(profile.data.name);
  }, [profile.data]);

  // AI Config
  const aiConfig = trpc.settings.getAiConfig.useQuery();
  const [provider, setProvider] = useState("GOOGLE");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [embedModel, setEmbedModel] = useState("");
  const selectedProvider = AI_PROVIDERS.find((p) => p.value === provider);

  const updateAiConfig = trpc.settings.updateAiConfig.useMutation({
    onSuccess: () => {
      utils.settings.getAiConfig.invalidate();
      toast.success("AI configuration saved!");
      setApiKey("");
    },
    onError: (err) => toast.error(err.message),
  });

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
      if (!model || !models.includes(model)) setModel(models[0]);
      const embeds = selectedProvider.embedModels as readonly string[];
      if (embeds.length > 0 && (!embedModel || !embeds.includes(embedModel))) {
        setEmbedModel(embeds[0] ?? "");
      }
    }
  }, [provider]);

  async function handleSignOut() {
    if (isGuest) {
      await fetch("/api/guest", { method: "DELETE" });
      router.push("/login");
      router.refresh();
    } else {
      signOut({ callbackUrl: "/login" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            {isGuest ? "Guest mode" : profile.data?.email}
          </DialogDescription>
        </DialogHeader>

        {/* Theme toggle */}
        <div className="flex items-center justify-between">
          <Label>Dark mode</Label>
          <Switch
            checked={theme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          />
        </div>

        <Separator />

        {/* Profile (non-guest only) */}
        {!isGuest && (
          <>
            <div className="space-y-3">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Profile
              </Label>
              <div className="space-y-2">
                <Label>Name</Label>
                <div className="flex gap-2">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={() => updateProfile.mutate({ name })}
                    disabled={updateProfile.isPending}
                  >
                    {updateProfile.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* AI Configuration */}
        <div className="space-y-3">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Brain className="h-3.5 w-3.5" /> AI Configuration
          </Label>

          {aiConfig.data && (
            <div className="flex items-center gap-2 text-xs text-green-600">
              <Check className="h-3.5 w-3.5" />
              {aiConfig.data.provider} &middot; {aiConfig.data.model}
            </div>
          )}

          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_PROVIDERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Key className="h-3 w-3" /> API Key
            </Label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                aiConfig.data
                  ? "Enter new key to update"
                  : "Enter your API key"
              }
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
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProvider &&
            selectedProvider.embedModels.length > 0 && (
              <div className="space-y-2">
                <Label>Embedding Model</Label>
                <Select value={embedModel} onValueChange={setEmbedModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProvider.embedModels.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
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
              updateAiConfig.mutate({
                provider: provider as any,
                apiKey: apiKey || "keep-existing",
                model,
                embedModel: embedModel || "text-embedding-3-small",
              });
            }}
            disabled={updateAiConfig.isPending}
            className="w-full"
            size="sm"
          >
            {updateAiConfig.isPending && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
            Save AI Config
          </Button>
        </div>

        <Separator />

        {/* Sign out */}
        <Button variant="outline" onClick={handleSignOut} className="w-full">
          <LogOut className="h-4 w-4 mr-2" />
          {isGuest ? "Exit Guest Mode" : "Sign Out"}
        </Button>

        {isGuest && (
          <p className="text-xs text-center text-muted-foreground">
            Guest mode &mdash; data is not saved
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
