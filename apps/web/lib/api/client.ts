

// Types
export type ProjectPublic = {
  id: string;
  user_id: string;
  name: string;
  industry: string;
  problem_statement: string;
  usp: string | null;
  stage: "idea" | "validated" | "building" | "launched";
  plan_json: Record<string, any> | null;
  roadmap_json: Record<string, any> | null;
  tokenomics_json: Record<string, any> | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type SkillPassportPublic = {
  id: string;
  user_id: string;
  skill_category: string;
  skill_name: string;
  evidence_url: string;
  evidence_description: string | null;
  evaluation_score: number;
  evaluation_notes: string | null;
  status: "pending" | "evaluating" | "approved" | "rejected" | "minting" | "minted";
  ipfs_metadata_uri: string | null;
  created_at: string;
  updated_at: string;
  nft_record?: {
    id: string;
    passport_id: string;
    user_id: string;
    token_id: number;
    contract_address: string;
    chain_id: number;
    tx_hash: string;
    block_number: number;
    metadata_json: Record<string, any>;
    minted_at: string;
  } | null;
};

export type AuditPublic = {
  id: string;
  user_id: string;
  contract_name: string | null;
  source_hash: string;
  status: "queued" | "processing" | "complete" | "failed";
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  info_count: number;
  overall_risk: "low" | "medium" | "high" | "critical" | null;
  report_summary: string | null;
  ai_model_used: string;
  processing_ms: number | null;
  created_at: string;
  completed_at: string | null;
};

export type AuditDetail = AuditPublic & {
  report_json?: Record<string, any> | null;
  source_code?: string; // stored for local display
};

export type AnalyticsEventPublic = {
  id: string;
  user_id: string | null;
  session_id: string | null;
  event_type: string;
  event_data: Record<string, any> | null;
  wallet_address: string | null;
  created_at: string;
};

export type DashboardSummary = {
  total_projects: number;
  total_passports: number;
  total_audits: number;
  completed_audits: number;
  minted_passports: number;
  recent_events: AnalyticsEventPublic[];
};

type ApiResponseEnvelope<T> = {
  data: T | null;
  error: { message?: string } | null;
  meta?: Record<string, any>;
};

// Initial Mock Data Sets for Local Failover
const INITIAL_PROJECTS: ProjectPublic[] = [
  {
    id: "p1-uuid",
    user_id: "u1-uuid",
    name: "Nexus AI Startup OS",
    industry: "Developer Tools",
    problem_statement: "Web3 startup founders lack cohesive tools for business planning, smart contract auditing, skill verification, and DAO setup in a single platform.",
    usp: "AI-agent-driven automation connected to verified soulbound Web3 credentials and automated security checkers.",
    stage: "building",
    plan_json: {
      market_size: "$15B target addressable market (TAM) by 2028.",
      business_model: "SaaS platform + transaction fee on mints/audits.",
      competitor_edge: "First tool integrating AI builders directly with audited on-chain reputation.",
    },
    roadmap_json: {
      Q3_2026: "Alpha release with wallet auth & CRUD APIs.",
      Q4_2026: "Beta release with AI Agent Integration & Audits.",
      Q1_2027: "Mainnet deployment and soulbound skill passports minting.",
    },
    tokenomics_json: {
      ticker: "NEXUS",
      utility: "Governance voting, discount on audit credits, rewards for credential verifiers.",
      total_supply: "100,000,000",
    },
    is_public: true,
    created_at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "p2-uuid",
    user_id: "u1-uuid",
    name: "Solidity SafeGuard",
    industry: "Cybersecurity",
    problem_statement: "Smart contract hacks caused $1.8B in losses in 2025. Standard manual audits are slow, expensive, and delayed.",
    usp: "Real-time, AI-powered static analysis providing near-instant auditor-grade reports.",
    stage: "idea",
    plan_json: null,
    roadmap_json: null,
    tokenomics_json: null,
    is_public: false,
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
];

const INITIAL_PASSPORTS: SkillPassportPublic[] = [
  {
    id: "pass1-uuid",
    user_id: "u1-uuid",
    skill_category: "Development",
    skill_name: "Solidity Smart Contracts",
    evidence_url: "https://github.com/example/solidity-skills-proof",
    evidence_description: "Completed hardhat test suites and deployed 3 live ERC20/ERC721 contracts on Polygon.",
    evaluation_score: 95,
    evaluation_notes: "AI evaluator verified the repository. Clean structure, complete unit test coverage, and optimized gas practices detected.",
    status: "minted",
    ipfs_metadata_uri: "ipfs://QmXoypizjW3WknFixtndZDF5LN46W866GLpx2585N4W7t2",
    created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    nft_record: {
      id: "nft1-uuid",
      passport_id: "pass1-uuid",
      user_id: "u1-uuid",
      token_id: 1042,
      contract_address: "0x9812A27c5950ECf7c4A4EF3dFdB02CDa6BbeF21A",
      chain_id: 80002,
      tx_hash: "0x4b78912cd312389100a98f123bcdeff120acdfba56789102abcdfef1234567ba",
      block_number: 4529182,
      metadata_json: { name: "Solidity Smart Contracts Verification", description: "Verifiable Solidity skill credential on Polygon Amoy" },
      minted_at: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    },
  },
  {
    id: "pass2-uuid",
    user_id: "u1-uuid",
    skill_category: "Product Management",
    skill_name: "Tokenomics Modeling",
    evidence_url: "https://docs.google.com/spreadsheets/d/tokenomics-model",
    evidence_description: "Created complete emission scheduler and dynamic sink simulator.",
    evaluation_score: 88,
    evaluation_notes: "Review pending full simulation verification. Solid baseline assumptions.",
    status: "approved",
    ipfs_metadata_uri: null,
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    nft_record: null,
  },
];

const INITIAL_AUDITS: AuditDetail[] = [
  {
    id: "audit1-uuid",
    user_id: "u1-uuid",
    contract_name: "StakingPool.sol",
    source_hash: "8a9f0e1d2c3b4a5e6f7d8c9b0a1f2e3d",
    status: "complete",
    critical_count: 0,
    high_count: 1,
    medium_count: 2,
    low_count: 3,
    info_count: 5,
    overall_risk: "medium",
    report_summary: "High risk vulnerability: Reentrancy in emergencyWithdraw. Medium risks: Lack of zero address validation, timestamp dependence. Fixed low risks.",
    ai_model_used: "Gemini 1.5 Pro",
    processing_ms: 4500,
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    source_code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract StakingPool {
    mapping(address => uint256) public balances;
    uint256 public totalStaked;

    function stake() external payable {
        balances[msg.sender] += msg.value;
        totalStaked += msg.value;
    }

    function emergencyWithdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No stake");
        
        // VULNERABLE: state updated after external call
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        balances[msg.sender] = 0;
        totalStaked -= amount;
    }
}`,
    report_json: {
      vulnerabilities: [
        {
          id: "V1",
          severity: "high",
          title: "Reentrancy Vulnerability",
          description: "In emergencyWithdraw(), the contract calls the sender address using call{value:...} before setting their balance mapping to 0. An attacker contract could reenter emergencyWithdraw to drain funds.",
          recommendation: "Apply check-effects-interactions pattern or use OpenZeppelin's ReentrancyGuard.",
        },
        {
          id: "V2",
          severity: "medium",
          title: "Timestamp Dependency",
          description: "Use of block.timestamp for checking stake maturity can be manipulated slightly by miners.",
          recommendation: "Ensure critical logic does not rely on sub-minute precision.",
        },
      ],
    },
  },
];

const INITIAL_EVENTS: AnalyticsEventPublic[] = [
  {
    id: "e1",
    user_id: "u1-uuid",
    session_id: "s1-uuid",
    event_type: "wallet_connected",
    event_data: { wallet: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F" },
    wallet_address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: "e2",
    user_id: "u1-uuid",
    session_id: "s1-uuid",
    event_type: "startup_created",
    event_data: { project_name: "Nexus AI Startup OS" },
    wallet_address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },
];

// Helper to interact with LocalStorage
function getLocalItem<T>(key: string, initial: T): T {
  if (typeof window === "undefined") return initial;
  const stored = localStorage.getItem(`nexus_mock_${key}`);
  if (!stored) {
    localStorage.setItem(`nexus_mock_${key}`, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(stored) as T;
  } catch {
    return initial;
  }
}

function setLocalItem<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`nexus_mock_${key}`, JSON.stringify(value));
}

// Wrapper executing fetch, or falling back to mock database
async function apiRequest<T>(
  url: string,
  options?: RequestInit,
  mockFallback?: () => T
): Promise<T> {
  try {
    const res = await fetch(url, options);

    // If session expired / auth needed, throw directly to let client handle redirect
    if (res.status === 401) {
      throw new Error("UNAUTHORIZED");
    }

    if (!res.ok) {
      throw new Error(`API Error: ${res.statusText}`);
    }

    const envelope = (await res.json()) as ApiResponseEnvelope<T>;
    if (envelope.error) {
      throw new Error(envelope.error.message || "Unknown API error");
    }

    if (envelope.data === null || envelope.data === undefined) {
      throw new Error("No data returned");
    }

    return envelope.data;
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      throw error;
    }
    console.warn(`API call to ${url} failed, falling back to mock storage.`, error);
    if (mockFallback) {
      return mockFallback();
    }
    throw error;
  }
}

// Analytics dashboard metrics & summaries
export async function fetchDashboard(): Promise<DashboardSummary> {
  return apiRequest("/api/v1/analytics/dashboard", {}, () => {
    const projects = getLocalItem("projects", INITIAL_PROJECTS);
    const passports = getLocalItem("passports", INITIAL_PASSPORTS);
    const audits = getLocalItem("audits", INITIAL_AUDITS);
    const events = getLocalItem("events", INITIAL_EVENTS);

    return {
      total_projects: projects.length,
      total_passports: passports.length,
      total_audits: audits.length,
      completed_audits: audits.filter((a) => a.status === "complete").length,
      minted_passports: passports.filter((p) => p.status === "minted").length,
      recent_events: events.slice(0, 10),
    };
  });
}

// --- PROJECTS APIs ---

export async function fetchProjects(): Promise<ProjectPublic[]> {
  return apiRequest("/api/v1/projects", {}, () => {
    return getLocalItem("projects", INITIAL_PROJECTS);
  });
}

export async function createProject(body: {
  name: string;
  industry: string;
  problem_statement: string;
  usp?: string;
  stage: string;
  is_public: boolean;
}): Promise<ProjectPublic> {
  return apiRequest(
    "/api/v1/projects",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    () => {
      const projects = getLocalItem("projects", INITIAL_PROJECTS);
      const newProj: ProjectPublic = {
        id: `p-${Math.random().toString(36).substring(2, 9)}`,
        user_id: "u1-uuid",
        name: body.name,
        industry: body.industry,
        problem_statement: body.problem_statement,
        usp: body.usp || null,
        stage: body.stage as any,
        plan_json: {
          market_size: "Simulated market projections pending AI evaluation (Phase 5).",
          business_model: "Subscription SaaS blueprint mockup.",
          competitor_edge: "Web3 verified proof of concepts.",
        },
        roadmap_json: {
          Phase_1: "Establish concept & architecture review.",
          Phase_2: "Integrate wallet connectivity & database.",
          Phase_3: "Launch verification testing.",
        },
        tokenomics_json: null,
        is_public: body.is_public,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updated = [newProj, ...projects];
      setLocalItem("projects", updated);
      recordMockEvent("startup_created", { project_name: body.name });
      return newProj;
    }
  );
}

export async function updateProject(
  id: string,
  body: Partial<ProjectPublic>
): Promise<ProjectPublic> {
  return apiRequest(
    `/api/v1/projects/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    () => {
      const projects = getLocalItem("projects", INITIAL_PROJECTS);
      const index = projects.findIndex((p) => p.id === id);
      if (index === -1) throw new Error("Project not found");

      const updatedProj: ProjectPublic = {
        ...projects[index],
        ...body,
        updated_at: new Date().toISOString(),
      };

      projects[index] = updatedProj;
      setLocalItem("projects", projects);
      return updatedProj;
    }
  );
}

export async function deleteProject(id: string): Promise<{ deleted: boolean; id: string }> {
  return apiRequest(
    `/api/v1/projects/${id}`,
    { method: "DELETE" },
    () => {
      const projects = getLocalItem("projects", INITIAL_PROJECTS);
      const filtered = projects.filter((p) => p.id !== id);
      setLocalItem("projects", filtered);
      return { deleted: true, id };
    }
  );
}

// --- PASSPORTS APIs ---

export async function fetchPassports(): Promise<SkillPassportPublic[]> {
  return apiRequest("/api/v1/passports", {}, () => {
    return getLocalItem("passports", INITIAL_PASSPORTS);
  });
}

export async function createPassport(body: {
  skill_category: string;
  skill_name: string;
  evidence_url: string;
  evidence_description?: string;
}): Promise<SkillPassportPublic> {
  return apiRequest(
    "/api/v1/passports",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    () => {
      const passports = getLocalItem("passports", INITIAL_PASSPORTS);
      const newPass: SkillPassportPublic = {
        id: `pass-${Math.random().toString(36).substring(2, 9)}`,
        user_id: "u1-uuid",
        skill_category: body.skill_category,
        skill_name: body.skill_name,
        evidence_url: body.evidence_url,
        evidence_description: body.evidence_description || null,
        evaluation_score: 0,
        evaluation_notes: "Submission successfully queued. Verification in progress.",
        status: "pending",
        ipfs_metadata_uri: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        nft_record: null,
      };

      const updated = [newPass, ...passports];
      setLocalItem("passports", updated);
      recordMockEvent("passport_evaluated", { skill_name: body.skill_name });
      return newPass;
    }
  );
}

// Trigger mint status for a passport through the backend flow, with local fallback for demos.
export async function mintPassportNFT(id: string): Promise<SkillPassportPublic> {
  return apiRequest(
    `/api/v1/passports/${id}/mint`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    () => {
      const passports = getLocalItem("passports", INITIAL_PASSPORTS);
      const index = passports.findIndex((p) => p.id === id);
      if (index === -1) throw new Error("Passport not found");

      const p = passports[index];
      const updatedPass: SkillPassportPublic = {
        ...p,
        status: "minted",
        ipfs_metadata_uri: `ipfs://QmMintedMockNFTMetadata-${id}`,
        nft_record: {
          id: `nft-${id}`,
          passport_id: id,
          user_id: p.user_id,
          token_id: Math.floor(Math.random() * 5000) + 1,
          contract_address: "0x9812A27c5950ECf7c4A4EF3dFdB02CDa6BbeF21A",
          chain_id: 80002,
          tx_hash: `0x${Array.from({ length: 64 }, () =>
            Math.floor(Math.random() * 16).toString(16)
          ).join("")}`,
          block_number: 4561000 + Math.floor(Math.random() * 5000),
          metadata_json: {
            name: p.skill_name,
            description: `Verifiable ${p.skill_category} Skill NFT`,
            reputation: {
              score: p.evaluation_score,
              xp_points: Math.round(p.evaluation_score * 2.5) + 100,
              badges: [p.evaluation_score >= 90 ? "Diamond" : "Verified"],
              network: "Polygon Amoy",
            },
          },
          minted_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      };

      passports[index] = updatedPass;
      setLocalItem("passports", passports);
      recordMockEvent("nft_minted", { skill_name: p.skill_name });
      return updatedPass;
    }
  );
}

export async function mintMockPassportNFT(id: string): Promise<SkillPassportPublic> {
  return mintPassportNFT(id);
}

// --- AUDIT APIs ---

export async function fetchAudits(): Promise<AuditPublic[]> {
  return apiRequest("/api/v1/audits", {}, () => {
    return getLocalItem("audits", INITIAL_AUDITS);
  });
}

export async function fetchAuditReport(id: string): Promise<AuditDetail> {
  return apiRequest(`/api/v1/audits/${id}`, {}, () => {
    const audits = getLocalItem("audits", INITIAL_AUDITS);
    const audit = audits.find((a) => a.id === id);
    if (!audit) throw new Error("Audit report not found");
    return audit;
  });
}

export async function submitAudit(body: {
  contract_name?: string;
  source_code: string;
}): Promise<AuditPublic> {
  return apiRequest(
    "/api/v1/audits/submit",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    () => {
      const audits = getLocalItem("audits", INITIAL_AUDITS);
      const auditName = body.contract_name || "Contract.sol";

      // Simple mock analyzer to count functions or issues
      const criticalCount = body.source_code.includes("selfdestruct") ? 1 : 0;
      const highCount = body.source_code.includes("delegatecall") || body.source_code.includes(".call{") ? 1 : 0;
      const mediumCount = body.source_code.includes("tx.origin") ? 2 : 1;
      const lowCount = 2;
      const infoCount = 4;

      const risk: AuditPublic["overall_risk"] =
        criticalCount > 0
          ? "critical"
          : highCount > 0
          ? "high"
          : mediumCount > 0
          ? "medium"
          : "low";

      const newAudit: AuditDetail = {
        id: `audit-${Math.random().toString(36).substring(2, 9)}`,
        user_id: "u1-uuid",
        contract_name: auditName,
        source_hash: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        status: "complete",
        critical_count: criticalCount,
        high_count: highCount,
        medium_count: mediumCount,
        low_count: lowCount,
        info_count: infoCount,
        overall_risk: risk,
        report_summary: `Static analysis of ${auditName} completed. Overall risk: ${risk.toUpperCase()}. Found ${criticalCount} critical issue, ${highCount} high risk issue, and ${mediumCount} medium risk issues. Check report details.`,
        ai_model_used: "Gemini 1.5 Flash (Medium)",
        processing_ms: 1200,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        source_code: body.source_code,
        report_json: {
          vulnerabilities: [
            ...(criticalCount
              ? [
                  {
                    id: "C1",
                    severity: "critical",
                    title: "Dangerous selfdestruct usage",
                    description: "The contract contains 'selfdestruct' function which can destroy the contract and burn stored assets if access-control parameters are weak.",
                    recommendation: "Avoid using selfdestruct in modern Solidity versions. Implement pause features instead.",
                  },
                ]
              : []),
            ...(highCount
              ? [
                  {
                    id: "H1",
                    severity: "high",
                    title: "State Modification after External Call",
                    description: "An external call to an untrusted contract occurs before state balances are set to zero. This opens the contract to Reentrancy attacks.",
                    recommendation: "Implement checks-effects-interactions or use OpenZeppelin ReentrancyGuard.",
                  },
                ]
              : []),
            {
              id: "M1",
              severity: "medium",
              title: "Implicit Visibility",
              description: "State variables or functions lack explicit visibility specifiers.",
              recommendation: "Always define visibility (public, external, internal, private) explicitly.",
            },
            {
              id: "L1",
              severity: "low",
              title: "Compiler Version Float",
              description: "Solidity pragma statement uses floating compiler definition (e.g. ^0.8.20).",
              recommendation: "Lock compiler version to ensure deterministic deployments.",
            },
          ],
        },
      };

      const updated = [newAudit, ...audits];
      setLocalItem("audits", updated);
      recordMockEvent("audit_completed", { contract_name: auditName, risk });
      return newAudit as AuditPublic;
    }
  );
}

// --- ANALYTICS APIs ---

export async function fetchAnalyticsEvents(): Promise<AnalyticsEventPublic[]> {
  return apiRequest("/api/v1/analytics/events", {}, () => {
    return getLocalItem("events", INITIAL_EVENTS);
  });
}

export async function recordAnalyticsEvent(body: {
  event_type: string;
  event_data?: Record<string, any>;
  wallet_address?: string;
}): Promise<AnalyticsEventPublic> {
  return apiRequest(
    "/api/v1/analytics/events",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    () => {
      return recordMockEvent(body.event_type, body.event_data, body.wallet_address);
    }
  );
}

// Private helper to dynamically append mock logs
function recordMockEvent(
  type: string,
  data?: Record<string, any>,
  wallet?: string
): AnalyticsEventPublic {
  const events = getLocalItem("events", INITIAL_EVENTS);
  const newEv: AnalyticsEventPublic = {
    id: `ev-${Math.random().toString(36).substring(2, 9)}`,
    user_id: "u1-uuid",
    session_id: "s1-uuid",
    event_type: type,
    event_data: data || null,
    wallet_address: wallet || "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    created_at: new Date().toISOString(),
  };

  const updated = [newEv, ...events];
  setLocalItem("events", updated);
  return newEv;
}
