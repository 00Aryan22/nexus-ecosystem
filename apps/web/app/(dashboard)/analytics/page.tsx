  "use client";

import { useEffect, useState } from "react";
import {
  fetchAnalyticsEvents,
  fetchDashboard,
  recordAnalyticsEvent,
  AnalyticsEventPublic,
  DashboardSummary,
} from "@/lib/api/client";
import {
  RefreshCcw,
  Users,
  Briefcase,
  ShieldAlert,
  Award,
  Activity,
  Play,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PageSpinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { StatCard } from "@/components/ui/stat-card";
import {
  DataTable,
  DataTableHeader,
  DataTableContent,
  DataTableHead,
  DataTableBody,
  DataTableRow,
  DataTableCell,
  DataTableHeadCell,
} from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { StatusBanner } from "@/components/ui/status-banner";

export default function AnalyticsPage() {
  const [events, setEvents] = useState<AnalyticsEventPublic[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [simEventType] = useState("wallet_connected");
  const [simulating, setSimulating] = useState(false);
  const loadEvents = async () => {
    setLoading(true);
    try {
      const [data, dash] = await Promise.allSettled([
        fetchAnalyticsEvents(),
        fetchDashboard(),
      ]);
      if (data.status === "fulfilled") setEvents(data.value);
      if (dash.status === "fulfilled") setSummary(dash.value);
      if (data.status === "rejected") setError(data.reason?.message || "Failed to load events");
    } catch (err: any) {
      setError(err.message || "Failed to load analytics");
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
    setFeedback(null);
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

      await loadEvents();
      setFeedback("Analytics event ingested successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to simulate event");
      setFeedback(null);
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return <PageSpinner label="Loading analytics..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6 max-w-6xl mx-auto">
        <PageHeader 
          title="Ecosystem Analytics"
          description="Global metrics, active users, and system health overview."
        />
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Projects", val: summary?.total_projects ?? "—", icon: Briefcase, col: "text-neon-blue" },
            { label: "Total Passports", val: summary?.total_passports ?? "—", icon: Users, col: "text-neon-purple" },
            { label: "Contracts Audited", val: summary?.total_audits ?? "—", icon: ShieldAlert, col: "text-amber-500" },
            { label: "Passports Minted", val: summary?.minted_passports ?? "—", icon: Award, col: "text-emerald-400" },
          ].map((stat, i) => (
            <StatCard
              key={i}
              title={stat.label}
              value={stat.val}
              icon={stat.icon}
              iconColor={stat.col}
              gradientColor="from-transparent to-transparent"
            />
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="outline" className="border-border-muted hover:bg-white/5" onClick={loadEvents}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Refresh Logs
          </Button>
          {feedback && <StatusBanner kind="success" message={feedback} className="sm:min-w-[280px]" />}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        <div className="lg:col-span-8 space-y-4">
          <DataTable>
            <DataTableHeader>
              <h3 className="font-heading font-semibold text-base">Ecosystem Event Stream</h3>
              <p className="text-xs text-muted-foreground">Raw analytics payload ingestion ledger.</p>
            </DataTableHeader>
            <DataTableContent>
              <DataTableHead>
                <tr>
                  <DataTableHeadCell>Event Type</DataTableHeadCell>
                  <DataTableHeadCell>Metadata</DataTableHeadCell>
                  <DataTableHeadCell>Timestamp</DataTableHeadCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {events.map((e) => (
                  <DataTableRow key={e.id}>
                    <DataTableCell>
                      <span className="font-mono text-xs bg-surface-slate px-2 py-0.5 rounded border border-border-muted">
                        {e.event_type}
                      </span>
                    </DataTableCell>
                    <DataTableCell className="font-mono text-[10px] text-muted-foreground">
                      {JSON.stringify(e.event_data)}
                    </DataTableCell>
                    <DataTableCell className="text-muted-foreground text-xs">
                      {new Date(e.created_at).toLocaleString()}
                    </DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTableContent>
          </DataTable>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <DataTable>
            <DataTableHeader>
              <h3 className="font-heading font-semibold text-base">Top Active Wallets</h3>
              <p className="text-xs text-muted-foreground">Addresses with the most interaction.</p>
            </DataTableHeader>
            <DataTableContent>
              <DataTableHead>
                <tr>
                  <DataTableHeadCell>Address</DataTableHeadCell>
                  <DataTableHeadCell className="text-right">Score</DataTableHeadCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {(summary?.recent_events ?? [])
                  .filter((e) => e.wallet_address)
                  .slice(0, 5)
                  .map((e, i) => (
                  <DataTableRow key={i}>
                    <DataTableCell className="font-mono text-neon-blue">
                      {e.wallet_address!.substring(0, 10)}...
                    </DataTableCell>
                    <DataTableCell className="text-right font-bold text-muted-foreground capitalize text-xs">
                      {e.event_type.replace(/_/g, " ")}
                    </DataTableCell>
                  </DataTableRow>
                ))}
                {(summary?.recent_events ?? []).filter((e) => e.wallet_address).length === 0 && (
                  <DataTableRow>
                    <DataTableCell colSpan={2} className="text-center text-muted-foreground text-xs py-4">
                      No wallet activity yet.
                    </DataTableCell>
                  </DataTableRow>
                )}
              </DataTableBody>
            </DataTableContent>
          </DataTable>

          <div className="glass-card p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neon-blue flex items-center gap-1.5 border-b border-border-muted pb-3 mb-4">
              <Activity className="h-4 w-4" /> Ingestion Simulator
            </h4>
            <form onSubmit={handleSimulateEvent} className="space-y-4">

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
