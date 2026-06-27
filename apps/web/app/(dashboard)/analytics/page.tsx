"use client";

import { useEffect, useState } from "react";
import {
  fetchAnalyticsEvents,
  recordAnalyticsEvent,
  AnalyticsEventPublic,
} from "@/lib/api/client";
import {
  BarChart3,
  RefreshCcw,
  Plus,
  Play,
  Calendar,
  Activity,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AnalyticsPage() {
  const [events, setEvents] = useState<AnalyticsEventPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [simEventType, setSimEventType] = useState("wallet_connected");
  const [simulating, setSimulating] = useState(false);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await fetchAnalyticsEvents();
      setEvents(data);
    } catch (err: any) {
      setError(err.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  const handleSimulateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    try {
      const mockPayload: Record<string, any> = {};
      if (simEventType === "wallet_connected") {
        mockPayload.wallet = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
      } else if (simEventType === "startup_created") {
        mockPayload.project_name = "Simulated Venture " + Math.floor(Math.random() * 100);
      } else if (simEventType === "audit_submitted") {
        mockPayload.contract_name = "SimToken.sol";
      } else {
        mockPayload.action = "user_click";
      }

      await recordAnalyticsEvent({
        event_type: simEventType,
        event_data: mockPayload,
      });

      // reload
      await loadEvents();
    } catch (err: any) {
      alert("Failed to simulate event: " + err.message);
    } finally {
      setSimulating(false);
    }
  };

  if (loading && events.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-blue border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action title bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight">System Logs & Analytics</h2>
          <p className="text-sm text-muted-foreground">Monitor platform events, session startups, and credential audit logs.</p>
        </div>
        <Button variant="outline" className="border-border-muted hover:bg-white/5" onClick={loadEvents}>
          <RefreshCcw className="mr-2 h-4 w-4" /> Refresh Logs
        </Button>
      </div>

      {/* Grid: Events Table & Ingestion Simulator */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left: Events Feed */}
        <div className="lg:col-span-8 space-y-4">
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-border-muted flex items-center justify-between">
              <div>
                <h3 className="font-heading font-semibold text-base">Ecosystem Event Stream</h3>
                <p className="text-xs text-muted-foreground">Raw analytics payload ingestion ledger.</p>
              </div>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full border border-neon-blue/20 bg-neon-blue/5 text-neon-blue">
                {events.length} logs
              </span>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                No events recorded. Use the simulator to inject test payloads.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border-muted bg-surface-slate/40 text-muted-foreground uppercase font-bold tracking-wider text-[10px] sticky top-0">
                      <th className="p-4 bg-surface-slate/90">Event Type</th>
                      <th className="p-4 bg-surface-slate/90">Metadata JSON</th>
                      <th className="p-4 bg-surface-slate/90">Wallet Address</th>
                      <th className="p-4 bg-surface-slate/90">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-muted/50">
                    {events.map((e) => (
                      <tr key={e.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="p-4">
                          <span className="font-mono font-semibold text-foreground bg-surface-slate border border-border-muted px-2 py-0.5 rounded text-[10px]">
                            {e.event_type}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-[10px] text-muted-foreground break-all max-w-[240px]">
                          {e.event_data ? JSON.stringify(e.event_data) : "{}"}
                        </td>
                        <td className="p-4 font-mono text-[10px] text-muted-foreground">
                          {e.wallet_address ? `${e.wallet_address.slice(0, 8)}...${e.wallet_address.slice(-6)}` : "—"}
                        </td>
                        <td className="p-4 text-muted-foreground font-mono text-[10px]">
                          {new Date(e.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: Simulator Pane */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neon-blue flex items-center gap-1.5 border-b border-border-muted pb-3 mb-4">
              <Activity className="h-4 w-4" /> Ingestion Simulator
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Inject custom actions directly into the database. Highly recommended to test schema parsing and DB triggers.
            </p>

            <form onSubmit={handleSimulateEvent} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Select Event Type
                </label>
                <select
                  className="w-full rounded border border-border-muted bg-surface-obsidian p-2.5 text-xs focus:border-neon-blue focus:outline-none"
                  value={simEventType}
                  onChange={(e) => setSimEventType(e.target.value)}
                >
                  <option value="wallet_connected">wallet_connected</option>
                  <option value="startup_created">startup_created</option>
                  <option value="audit_submitted">audit_submitted</option>
                  <option value="profile_updated">profile_updated</option>
                  <option value="dashboard_viewed">dashboard_viewed</option>
                </select>
              </div>

              <Button
                type="submit"
                disabled={simulating}
                className="w-full bg-neon-blue hover:bg-neon-blue/80 text-white text-xs py-2"
              >
                <Play className="mr-1.5 h-3 w-3 fill-current" />
                {simulating ? "Injecting Payload..." : "Simulate & Ingest"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
