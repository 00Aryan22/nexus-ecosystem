"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Briefcase,
  Key,
  Save,
  Search,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import {
  useAISettings,
  useUpdateAISettings,
  useAIProviders,
  useAIHealth,
} from "@/hooks/use-founder-agent";
import { recordAnalyticsEvent } from "@/lib/api/client";

export default function SettingsPage() {
  const { user, setUser, address } = useAuth();
  const aiSettings = useAISettings();
  const updateAiSettings = useUpdateAISettings();
  const aiProviders = useAIProviders();
  const aiHealth = useAIHealth();
  const [saved, setSaved] = useState(false);

  const [provider, setProvider] = useState("gemini");
  const [model, setModel] = useState("gemini-2.0-flash");
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(1.0);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [streaming, setStreaming] = useState(true);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [maxRetrievedDocs, setMaxRetrievedDocs] = useState(5);
  const [formInitialized, setFormInitialized] = useState(false);

  useEffect(() => {
    if (aiSettings.data && !formInitialized) {
      setProvider(aiSettings.data.defaultProvider);
      setModel(aiSettings.data.defaultModel);
      setTemperature(aiSettings.data.temperature);
      setTopP(aiSettings.data.topP);
      setMaxTokens(aiSettings.data.maxTokens);
      setStreaming(aiSettings.data.streamingEnabled);
      setMemoryEnabled(aiSettings.data.memoryEnabled);
      setMaxRetrievedDocs(aiSettings.data.maxRetrievedDocs);
      setFormInitialized(true);
    }
  }, [aiSettings.data, formInitialized]);

  const handleSave = useCallback(async () => {
    try {
      await updateAiSettings.mutateAsync({
        defaultProvider: provider,
        defaultModel: model,
        temperature,
        topP,
        maxTokens,
        streamingEnabled: streaming,
        memoryEnabled,
        maxRetrievedDocs,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save settings", err);
    }
  }, [provider, model, temperature, topP, maxTokens, streaming, memoryEnabled, maxRetrievedDocs, updateAiSettings]);

  const handleRoleChange = async (role: "founder" | "auditor" | "admin") => {
    if (!user) return;
    try {
      setUser({ ...user, role });
      await recordAnalyticsEvent({
        event_type: "profile_updated",
        event_data: { updated_role: role },
      });
    } catch (err) {
      console.error("Failed to log role update", err);
    }
  };

  const roles = [
    {
      id: "founder",
      name: "Founder",
      desc: "Build ventures, model roadmaps, and track product milestones.",
      icon: Briefcase,
      color: "border-neon-blue/20 text-neon-blue bg-neon-blue/5",
      activeColor: "border-neon-blue bg-neon-blue/10 text-neon-blue ring-1 ring-neon-blue",
    },
    {
      id: "auditor",
      name: "Auditor",
      desc: "Scan contracts and publish security audit findings.",
      icon: Search,
      color: "border-amber-500/20 text-amber-400 bg-amber-500/5",
      activeColor: "border-amber-500 bg-amber-500/10 text-amber-400 ring-1 ring-amber-500",
    },
    {
      id: "admin",
      name: "Admin",
      desc: "Manage ecosystem verification and approvals.",
      icon: Key,
      color: "border-neon-purple/20 text-neon-purple bg-neon-purple/5",
      activeColor: "border-neon-purple bg-neon-purple/10 text-neon-purple ring-1 ring-neon-purple",
    },
  ];

  const providerList = aiProviders.data ?? [];
  const currentHealth = aiHealth.data?.find((h) => h.provider === provider);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Settings"
        description="Configure AI provider, model parameters, and workspace preferences."
      />

      <Tabs defaultValue="ai">
        <TabsList>
          <TabsTrigger value="ai">AI Configuration</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="ai">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>AI Provider</CardTitle>
                <CardDescription>Select your preferred LLM provider and model.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Provider
                  </label>
                  <Select
                    value={provider}
                    onChange={(e) => {
                      setProvider(e.target.value);
                      const meta = providerList.find((p) => p.id === e.target.value);
                      if (meta) setModel(meta.defaultModel);
                    }}
                    className="w-full"
                  >
                    {providerList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.displayName}
                      </option>
                    ))}
                  </Select>
                  {currentHealth && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${
                          currentHealth.status === "healthy" ? "bg-emerald-400" : "bg-red-400"
                        }`}
                      />
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {currentHealth.status === "healthy" ? "Connected" : currentHealth.status}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Model
                  </label>
                  <Input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. gemini-2.0-flash"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Model Parameters</CardTitle>
                <CardDescription>Fine-tune the AI response behavior.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Temperature ({temperature.toFixed(1)})
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-neon-purple"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Precise (0)</span>
                    <span>Creative (2)</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Top P ({topP.toFixed(1)})
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={topP}
                    onChange={(e) => setTopP(parseFloat(e.target.value))}
                    className="w-full accent-neon-blue"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Focused (0)</span>
                    <span>Diverse (1)</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Max Tokens
                  </label>
                  <Input
                    type="number"
                    min={256}
                    max={128000}
                    step={256}
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value) || 4096)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Features</CardTitle>
                <CardDescription>Toggle AI features and workspace integration.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center justify-between rounded-lg border border-border-muted p-3 cursor-pointer hover:bg-white/[0.02]">
                  <div>
                    <p className="text-sm font-medium text-foreground">Streaming Responses</p>
                    <p className="text-xs text-muted-foreground">See AI responses token by token in real-time.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={streaming}
                    onChange={(e) => setStreaming(e.target.checked)}
                    className="h-4 w-4 accent-neon-purple rounded"
                  />
                </label>

                <label className="flex items-center justify-between rounded-lg border border-border-muted p-3 cursor-pointer hover:bg-white/[0.02]">
                  <div>
                    <p className="text-sm font-medium text-foreground">Workspace Knowledge</p>
                    <p className="text-xs text-muted-foreground">Enable semantic search across uploaded documents.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={memoryEnabled}
                    onChange={(e) => setMemoryEnabled(e.target.checked)}
                    className="h-4 w-4 accent-neon-purple rounded"
                  />
                </label>

                {memoryEnabled && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Max Retrieved Documents ({maxRetrievedDocs})
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      step={1}
                      value={maxRetrievedDocs}
                      onChange={(e) => setMaxRetrievedDocs(parseInt(e.target.value))}
                      className="w-full accent-neon-blue"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Minimal (1)</span>
                      <span>Comprehensive (20)</span>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={updateAiSettings.isPending}
                    className="bg-neon-purple hover:bg-neon-purple/80 text-white"
                  >
                    <Save className="h-4 w-4 mr-1.5" />
                    {updateAiSettings.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                  {saved && (
                    <span className="ml-3 text-xs text-emerald-400 font-medium">
                      Settings saved successfully.
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profile">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Session</CardTitle>
                  <CardDescription>Your connected wallet and identity.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3.5 text-xs font-mono">
                  <div>
                    <p className="text-muted-foreground text-[9px] uppercase tracking-wider">Wallet</p>
                    <p className="mt-1 text-foreground truncate">{address || "Not Connected"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[9px] uppercase tracking-wider">Auth</p>
                    <div className="mt-1 flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <ShieldCheck className="h-4 w-4" />
                      <span>SIWE Secure</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[9px] uppercase tracking-wider">Role</p>
                    <p className="mt-1 text-foreground capitalize font-semibold">{user?.role || "Founder"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[9px] uppercase tracking-wider">Status</p>
                    <div className="mt-1">
                      <Badge variant="success">Active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Persona</CardTitle>
                  <CardDescription>Choose your ecosystem role.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {roles.map((role) => {
                    const Icon = role.icon;
                    const isActive = user?.role === role.id;
                    return (
                      <div
                        key={role.id}
                        onClick={() => handleRoleChange(role.id as any)}
                        className={`flex items-start gap-4 rounded-lg border p-4 cursor-pointer transition-all ${
                          isActive ? role.activeColor : `${role.color} hover:bg-white/[0.02]`
                        }`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter") handleRoleChange(role.id as any); }}
                        aria-pressed={isActive}
                      >
                        <div className="rounded-lg bg-surface-slate p-2 border border-border-muted flex-shrink-0">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-foreground">{role.name}</h4>
                          <p className="text-[10px] text-muted-foreground mt-1">{role.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Info</CardTitle>
              <CardDescription>Environment and version details.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 text-xs font-mono">
                <div>
                  <p className="text-muted-foreground text-[9px] uppercase tracking-wider">API Host</p>
                  <p className="mt-1 text-foreground">{process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[9px] uppercase tracking-wider">Network</p>
                  <p className="mt-1 text-foreground flex items-center gap-1">
                    <Activity className="h-3 w-3 text-neon-blue" />
                    Polygon Amoy (80002)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
