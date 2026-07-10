# Deprecation Audit

## websockets.legacy

| Field | Value |
|-------|-------|
| **Warning** | `websockets.legacy is deprecated` (since websockets 14.0) |
| **Source Package** | `web3==7.16.0` |
| **Import Chain** | `siwe` → `web3` → `web3.providers.legacy_websocket` → `websockets.legacy` |
| **Root Cause** | `web3`'s `LegacyWebSocketProvider` imports from `websockets.legacy.client` |
| **Impact** | Informational warning only — no functional impact |
| **Action Taken** | Suppressed in pytest via `-W ignore::DeprecationWarning:websockets.legacy` |
| **Compatible Fix Available** | No — newer `web3` versions do not exist (7.16.0 is latest) |
| **Recommendation** | Monitor `web3` releases for a version that migrates from `LegacyWebSocketProvider` to the modern `websockets` API |
| **Expected Resolution** | Upstream fix in `web3` package |
