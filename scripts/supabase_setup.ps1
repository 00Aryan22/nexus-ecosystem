# PowerShell helper script for Supabase CLI setup (Windows)
param()

Write-Host "Running Supabase CLI helper..."

supabase login
supabase init
supabase link --project-ref oinwkcxefniumshicvuj

Write-Host "Supabase link complete. Update .env.local with your keys."