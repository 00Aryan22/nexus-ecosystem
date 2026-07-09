export type ContractVerificationRequest = {
  contract_name: string;
  source_code: string;
  compiler_version: string;
  contract_address: string;
};

export type VerificationResult = {
  verified: boolean;
  contract_name: string;
  contract_address: string;
  compiler_version: string;
  matches: boolean;
  warnings: string[];
};

export type ABIResult = {
  abi: Record<string, any>[];
  contract_name: string | null;
  functions: { name: string; params: string; visibility: string; state_mutability: string; returns: string }[];
  events: { name: string; params: string }[];
  errors: { name: string; params: string }[];
};

export type GasEstimateResult = {
  estimated_gas: number;
  function_name: string | null;
  complexity: string;
  breakdown: Record<string, number>;
};

type ApiResponseEnvelope<T> = {
  data: T | null;
  error: { message?: string } | null;
};

async function infraRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.detail || res.statusText);
  }
  const envelope = (await res.json()) as ApiResponseEnvelope<T>;
  if (envelope.error) throw new Error(envelope.error.message || "Unknown API error");
  if (envelope.data === null || envelope.data === undefined) throw new Error("No data returned");
  return envelope.data;
}

export async function verifyContract(body: ContractVerificationRequest): Promise<VerificationResult> {
  return infraRequest("/api/v1/dev-infra/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function generateABI(sourceCode: string, contractName?: string): Promise<ABIResult> {
  return infraRequest("/api/v1/dev-infra/abi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source_code: sourceCode, contract_name: contractName || null }),
  });
}

export async function estimateGas(sourceCode: string, functionName?: string): Promise<GasEstimateResult> {
  return infraRequest("/api/v1/dev-infra/gas-estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source_code: sourceCode, function_name: functionName || null }),
  });
}

export async function fetchContractTemplates(): Promise<{ name: string; description: string; category: string; complexity: string }[]> {
  return infraRequest("/api/v1/dev-infra/templates");
}
