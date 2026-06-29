#!/usr/bin/env bash
# Helper script to perform common Supabase CLI setup steps.
# Run locally after installing the Supabase CLI.

set -euo pipefail

echo "Logging into Supabase (interactive)..."
supabase login

echo "Initializing supabase config (creates .supabase)..."
supabase init

echo "Linking to project ref oinwkcxefniumshicvuj..."
supabase link --project-ref oinwkcxefniumshicvuj

echo "Done. Add the publishable key and service role to your .env.local files as needed."
