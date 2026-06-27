"use client";

import { useEffect, useState } from "react";
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
  ProjectPublic,
} from "@/lib/api/client";
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Calendar,
  Layers,
  Coins,
  Globe,
  Lock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PageSpinner } from "@/components/ui/spinner";
import { ErrorState } from "@/components/ui/error-state";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseButton,
} from "@/components/ui/dialog";

export default function StartupBuilderPage() {
  const [projects, setProjects] = useState<ProjectPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail view state
  const [selectedProject, setSelectedProject] = useState<ProjectPublic | null>(null);

  // Edit / Creation modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editProjectId, setEditProjectId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<{
    name: string;
    industry: string;
    problem_statement: string;
    usp: string;
    stage: "idea" | "validated" | "building" | "launched";
    is_public: boolean;
  }>({
    name: "",
    industry: "",
    problem_statement: "",
    usp: "",
    stage: "idea",
    is_public: false,
  });

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await fetchProjects();
        setProjects(data);
        if (data.length > 0) {
          setSelectedProject(data[0]);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load projects");
      } finally {
        setLoading(false);
      }
    }
    void loadProjects();
  }, []);

  const handleOpenCreateModal = () => {
    setFormData({
      name: "",
      industry: "",
      problem_statement: "",
      usp: "",
      stage: "idea",
      is_public: false,
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (project: ProjectPublic) => {
    setFormData({
      name: project.name,
      industry: project.industry,
      problem_statement: project.problem_statement,
      usp: project.usp || "",
      stage: project.stage as any,
      is_public: project.is_public,
    });
    setEditProjectId(project.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.industry || !formData.problem_statement) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      if (isEditing && editProjectId) {
        const updated = await updateProject(editProjectId, formData);
        setProjects((prev) =>
          prev.map((p) => (p.id === editProjectId ? updated : p))
        );
        if (selectedProject?.id === editProjectId) {
          setSelectedProject(updated);
        }
      } else {
        const created = await createProject(formData);
        setProjects((prev) => [created, ...prev]);
        setSelectedProject(created);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to save project");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (selectedProject?.id === id) {
        const remaining = projects.filter((p) => p.id !== id);
        setSelectedProject(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete project");
    }
  };

  const getStageVariant = (stage: string): "neutral" | "primary" | "secondary" | "success" => {
    switch (stage) {
      case "idea":
        return "neutral";
      case "validated":
        return "primary";
      case "building":
        return "secondary";
      case "launched":
        return "success";
      default:
        return "neutral";
    }
  };

  if (loading) {
    return <PageSpinner label="Loading startup workspace..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Startup Workspace"
        description="Scaffold plans, model tokenomics, and monitor development stages."
        action={
          <Button className="neon-glow bg-neon-blue hover:bg-neon-blue/80 text-white" onClick={handleOpenCreateModal}>
            <Plus className="mr-2 h-4 w-4" /> Add Project
          </Button>
        }
      />

      {/* Main Grid: Projects sidebar (left 4 cols) & detailed blueprints (right 8 cols) */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Side: Projects List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-3">
              Your Ventures ({projects.length})
            </h3>
            {projects.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground">
                No startup projects found. Create one to begin.
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => setSelectedProject(proj)}
                    className={`group flex items-center justify-between rounded-lg border p-3.5 cursor-pointer transition-all ${
                      selectedProject?.id === proj.id
                        ? "border-neon-blue bg-neon-blue/5 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                        : "border-border-muted bg-surface-slate/40 hover:bg-surface-slate/80 hover:border-border"
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold group-hover:text-neon-blue transition-colors">
                          {proj.name}
                        </span>
                        {proj.is_public ? (
                          <Globe className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{proj.industry}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={getStageVariant(proj.stage)}>
                        {proj.stage}
                      </Badge>
                      <ChevronRight className="h-4.5 w-4.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Venture Blueprint Panel */}
        <div className="lg:col-span-8">
          {!selectedProject ? (
            <div className="glass-card p-12 text-center text-muted-foreground text-sm">
              Select or create a project to load its blueprint details.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Project Title Card */}
              <div className="glass-card p-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading text-xl font-bold tracking-tight">{selectedProject.name}</h3>
                      <Badge variant={getStageVariant(selectedProject.stage)}>
                        {selectedProject.stage}
                      </Badge>
                    </div>
                    <p className="text-xs text-neon-blue mt-1 font-semibold">{selectedProject.industry}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="border-border-muted hover:bg-white/5" onClick={() => handleOpenEditModal(selectedProject)}>
                      <Edit2 className="mr-1.5 h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/30" onClick={(e) => handleDelete(selectedProject.id, e)}>
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Problem Statement
                    </h4>
                    <p className="text-xs leading-relaxed text-foreground bg-surface-obsidian/30 border border-border-muted/50 p-3 rounded">
                      {selectedProject.problem_statement}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Unique Selling Proposition (USP)
                    </h4>
                    <p className="text-xs leading-relaxed text-foreground bg-surface-obsidian/30 border border-border-muted/50 p-3 rounded">
                      {selectedProject.usp || "No USP defined yet."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Blueprint sections */}
              <div className="grid gap-6 md:grid-cols-3">
                {/* AI market plan */}
                <div className="glass-card p-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neon-blue flex items-center gap-1.5 border-b border-border-muted pb-3">
                    <Sparkles className="h-4 w-4" /> AI Startup Blueprint
                  </h4>
                  {selectedProject.plan_json ? (
                    <div className="space-y-3 text-[11px]">
                      <div>
                        <p className="font-semibold text-muted-foreground uppercase text-[9px] tracking-wider">Market Analysis</p>
                        <p className="mt-1 text-foreground">{selectedProject.plan_json.market_size}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-muted-foreground uppercase text-[9px] tracking-wider">Business Model</p>
                        <p className="mt-1 text-foreground">{selectedProject.plan_json.business_model}</p>
                      </div>
                      {selectedProject.plan_json.competitor_edge && (
                        <div>
                          <p className="font-semibold text-muted-foreground uppercase text-[9px] tracking-wider">Competitive Edge</p>
                          <p className="mt-1 text-foreground">{selectedProject.plan_json.competitor_edge}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-muted-foreground">
                      AI Plan is not generated. Build roadmap in Settings or wait for Phase 5 agent.
                    </div>
                  )}
                </div>

                {/* Milestones roadmap */}
                <div className="glass-card p-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neon-purple flex items-center gap-1.5 border-b border-border-muted pb-3">
                    <Calendar className="h-4 w-4" /> Milestones Roadmap
                  </h4>
                  {selectedProject.roadmap_json ? (
                    <div className="space-y-3.5 text-[11px] relative pl-3 border-l border-border-muted/80 ml-1">
                      {Object.entries(selectedProject.roadmap_json).map(([quarter, milestone], index) => (
                        <div key={index} className="relative">
                          <div className="absolute -left-[17px] top-0.5 h-2 w-2 rounded-full bg-neon-purple shadow-[0_0_5px_#a855f7]" />
                          <p className="font-semibold text-foreground">{quarter.replace("_", " ")}</p>
                          <p className="mt-0.5 text-muted-foreground">{milestone}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-muted-foreground">
                      No roadmap milestones generated yet.
                    </div>
                  )}
                </div>

                {/* Tokenomics Structure */}
                <div className="glass-card p-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 border-b border-border-muted pb-3">
                    <Coins className="h-4 w-4" /> Tokenomics Spec
                  </h4>
                  {selectedProject.tokenomics_json ? (
                    <div className="space-y-3 text-[11px]">
                      <div>
                        <p className="font-semibold text-muted-foreground uppercase text-[9px] tracking-wider">Token Symbol</p>
                        <p className="mt-1 text-foreground font-mono font-bold text-amber-400">{selectedProject.tokenomics_json.ticker}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-muted-foreground uppercase text-[9px] tracking-wider">Total Supply</p>
                        <p className="mt-1 text-foreground font-mono">{selectedProject.tokenomics_json.total_supply}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-muted-foreground uppercase text-[9px] tracking-wider">Utility Model</p>
                        <p className="mt-1 text-foreground">{selectedProject.tokenomics_json.utility}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-muted-foreground">
                      Tokenomics modeling pending token launch phase.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <DialogCloseButton onClose={() => setIsModalOpen(false)} />
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Startup Project" : "Create Startup Project"}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form onSubmit={handleSubmit} className="space-y-4" id="project-form">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Project Name *
                </label>
                <Input
                  required
                  placeholder="e.g. DeFi Staking Hub"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Industry *
                </label>
                <Input
                  required
                  placeholder="e.g. DeFi, Identity, Gaming"
                  value={formData.industry}
                  onChange={(e) => setFormData((prev) => ({ ...prev, industry: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Problem Statement *
              </label>
              <Textarea
                required
                rows={3}
                placeholder="Describe the problem your startup aims to solve..."
                value={formData.problem_statement}
                onChange={(e) => setFormData((prev) => ({ ...prev, problem_statement: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Unique Selling Proposition (USP)
              </label>
              <Textarea
                rows={2}
                placeholder="What makes your solution different and better?"
                value={formData.usp}
                onChange={(e) => setFormData((prev) => ({ ...prev, usp: e.target.value }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Project Stage
                </label>
                <Select
                  value={formData.stage}
                  onChange={(e) => setFormData((prev) => ({ ...prev, stage: e.target.value as any }))}
                >
                  <option value="idea">Idea Stage</option>
                  <option value="validated">Market Validated</option>
                  <option value="building">Building MVP</option>
                  <option value="launched">Launched Product</option>
                </Select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="is_public"
                  className="h-4 w-4 rounded border-border-muted text-neon-blue bg-surface-obsidian focus:ring-0 focus:ring-offset-0"
                  checked={formData.is_public}
                  onChange={(e) => setFormData((prev) => ({ ...prev, is_public: e.target.checked }))}
                />
                <label htmlFor="is_public" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer">
                  Publish Publicly (Visible to Audits)
                </label>
              </div>
            </div>
          </form>
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="border-border-muted hover:bg-white/5"
            onClick={() => setIsModalOpen(false)}
          >
            Cancel
          </Button>
          <Button form="project-form" type="submit" className="bg-neon-blue hover:bg-neon-blue/80 text-white font-semibold px-6">
            {isEditing ? "Save Changes" : "Create Project"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
