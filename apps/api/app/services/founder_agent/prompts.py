SYSTEM_PROMPT_FOUNDER_AGENT = """
You are the Nexus AI Founder Agent, an expert AI co-founder for web3 and tech startups.
Your goal is to assist founders in brainstorming, validating ideas, crafting business models,
generating pitch deck outlines, and deciding on technical stacks.

Always structure your responses clearly using Markdown.
When asked to generate a specific framework (e.g., Lean Canvas, Business Model Canvas,
SWOT Analysis, Roadmap), format it clearly with headings and bullet points.

Maintain a professional, encouraging, and insightful tone. Challenge the founder's
assumptions constructively. Focus heavily on practical, actionable advice rather than
vague platitudes.
""".strip()

PLAN_TYPE_PROMPTS: dict[str, str] = {
    "startup_idea": (
        "Generate 3 distinct startup ideas based on the founder's context. "
        "For each idea include: name, one-line pitch, target customer, and key differentiator."
    ),
    "business_model_canvas": (
        "Produce a Business Model Canvas with sections: Key Partners, Key Activities, "
        "Key Resources, Value Propositions, Customer Relationships, Channels, Customer Segments, "
        "Cost Structure, Revenue Streams."
    ),
    "lean_canvas": (
        "Produce a Lean Canvas with: Problem, Customer Segments, Unique Value Proposition, "
        "Solution, Channels, Revenue Streams, Cost Structure, Key Metrics, Unfair Advantage."
    ),
    "problem_solution": (
        "Define the core problem, affected users, current alternatives, and your proposed "
        "solution with clear before/after outcomes."
    ),
    "revenue_model": (
        "Recommend revenue models with pricing tiers, unit economics assumptions, and "
        "a 12-month revenue projection outline."
    ),
    "competitor_analysis": (
        "Analyze direct and indirect competitors. Include positioning matrix, strengths, "
        "weaknesses, and differentiation opportunities."
    ),
    "swot": (
        "Provide a SWOT analysis with Strengths, Weaknesses, Opportunities, and Threats, "
        "each with 3-5 actionable bullet points."
    ),
    "gtm_strategy": (
        "Draft a go-to-market strategy covering ICP, messaging, acquisition channels, "
        "launch sequence, and first 90-day milestones."
    ),
    "mvp_planner": (
        "Define an MVP scope with must-have features, out-of-scope items, validation metrics, "
        "and a 6-week build plan."
    ),
    "tech_stack": (
        "Recommend a production-ready tech stack with frontend, backend, database, AI, "
        "blockchain (if relevant), and DevOps tooling with rationale."
    ),
    "pitch_deck": (
        "Outline a 10-slide pitch deck: Problem, Solution, Market, Product, Traction, "
        "Business Model, Competition, Team, Financials, Ask."
    ),
    "roadmap": (
        "Create a phased product roadmap with quarterly milestones, dependencies, and "
        "success metrics for the next 12 months."
    ),
}

PROMPT_SUGGESTIONS: list[dict[str, str | None]] = [
    {
        "label": "Generate startup ideas",
        "prompt": "Help me brainstorm 3 startup ideas in the Web3 + AI space for solo founders.",
        "plan_type": "startup_idea",
    },
    {
        "label": "Build a Lean Canvas",
        "prompt": "Create a Lean Canvas for a decentralized identity platform for freelancers.",
        "plan_type": "lean_canvas",
    },
    {
        "label": "Competitor analysis",
        "prompt": "Analyze competitors for an AI-powered smart contract auditing platform.",
        "plan_type": "competitor_analysis",
    },
    {
        "label": "GTM strategy",
        "prompt": "Draft a go-to-market strategy for launching on Polygon Amoy testnet first.",
        "plan_type": "gtm_strategy",
    },
    {
        "label": "Tech stack recommendation",
        "prompt": "Recommend a tech stack for a Next.js + FastAPI startup OS with wallet auth.",
        "plan_type": "tech_stack",
    },
    {
        "label": "Pitch deck outline",
        "prompt": "Outline a 10-slide pitch deck for an AI founder operating system.",
        "plan_type": "pitch_deck",
    },
]

PLAN_TYPE_KEYWORDS: dict[str, list[str]] = {
    "startup_idea": ["startup idea", "brainstorm", "ideas"],
    "business_model_canvas": ["business model canvas", "bmc"],
    "lean_canvas": ["lean canvas"],
    "problem_solution": ["problem", "solution", "problem/solution"],
    "revenue_model": ["revenue model", "monetization", "pricing"],
    "competitor_analysis": ["competitor", "competition", "competitive"],
    "swot": ["swot"],
    "gtm_strategy": ["go-to-market", "gtm", "launch strategy"],
    "mvp_planner": ["mvp", "minimum viable"],
    "tech_stack": ["tech stack", "technology stack", "architecture"],
    "pitch_deck": ["pitch deck", "investor deck"],
    "roadmap": ["roadmap", "milestones"],
}


def detect_plan_type(prompt: str, explicit_type: str | None = None) -> str | None:
    if explicit_type and explicit_type in PLAN_TYPE_PROMPTS:
        return explicit_type
    lower = prompt.lower()
    for plan_type, keywords in PLAN_TYPE_KEYWORDS.items():
        if any(keyword in lower for keyword in keywords):
            return plan_type
    return None


def build_enhanced_prompt(prompt: str, plan_type: str | None) -> str:
    if not plan_type or plan_type not in PLAN_TYPE_PROMPTS:
        return prompt
    return f"{PLAN_TYPE_PROMPTS[plan_type]}\n\nFounder request:\n{prompt}"
