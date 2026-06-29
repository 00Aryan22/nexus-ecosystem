/**
 * Feature Flag System
 *
 * Environment-based feature flags for the Nexus AI ecosystem.
 * Flags are read from NEXT_PUBLIC_FF_* environment variables.
 * Default values are set to `true` for currently available features,
 * and `false` for features that are still under development.
 */

export type FeatureFlag =
  | "dashboard"
  | "startup_builder"
  | "skill_passport"
  | "contract_auditor"
  | "analytics"
  | "founder_agent"
  | "settings";

const FLAG_DEFAULTS: Record<FeatureFlag, boolean> = {
  dashboard: true,
  startup_builder: true,
  skill_passport: true,
  contract_auditor: true,
  analytics: true,
  founder_agent: true,
  settings: true,
};

function readEnvFlag(flag: FeatureFlag): boolean | undefined {
  if (typeof window === "undefined" && typeof process !== "undefined") {
    const envKey = `NEXT_PUBLIC_FF_${flag.toUpperCase()}`;
    const val = process.env[envKey];
    if (val === "true" || val === "1") return true;
    if (val === "false" || val === "0") return false;
    return undefined;
  }

  // Client-side: Next.js inlines NEXT_PUBLIC_* at build time
  const envKey = `NEXT_PUBLIC_FF_${flag.toUpperCase()}`;
  const val = (globalThis as Record<string, unknown>)[envKey] as
    | string
    | undefined;
  if (val === "true" || val === "1") return true;
  if (val === "false" || val === "0") return false;
  return undefined;
}

function readAllOverride(): boolean {
  // Check server-side
  if (typeof window === "undefined" && typeof process !== "undefined") {
    const val = process.env["NEXT_PUBLIC_FF_ALL"];
    return val === "true" || val === "1";
  }
  // Client-side: Next.js inlines NEXT_PUBLIC_* at build time
  const val = (globalThis as Record<string, unknown>)["NEXT_PUBLIC_FF_ALL"] as string | undefined;
  return val === "true" || val === "1";
}

/**
 * Check whether a feature flag is enabled.
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  // Global override: enable all features if NEXT_PUBLIC_FF_ALL is set
  try {
    if (readAllOverride()) return true;
  } catch {
    // ignore and continue
  }
  const envValue = readEnvFlag(flag);
  if (envValue !== undefined) return envValue;
  return FLAG_DEFAULTS[flag];
}

/**
 * Helper: map a route path to a feature flag.
 * Returns `null` if the path doesn't map to any flag.
 */
export function routeToFeatureFlag(
  pathname: string
): FeatureFlag | null {
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/startup-builder")) return "startup_builder";
  if (pathname.startsWith("/skill-passport")) return "skill_passport";
  if (pathname.startsWith("/auditor")) return "contract_auditor";
  if (pathname.startsWith("/analytics")) return "analytics";
  if (pathname.startsWith("/founder-agent")) return "founder_agent";
  if (pathname.startsWith("/settings")) return "settings";
  return null;
}

/**
 * Get all feature flags with their current enabled state.
 */
export function getAllFeatureFlags(): Record<FeatureFlag, boolean> {
  const flags = {} as Record<FeatureFlag, boolean>;
  for (const key of Object.keys(FLAG_DEFAULTS) as FeatureFlag[]) {
    flags[key] = isFeatureEnabled(key);
  }
  return flags;
}
