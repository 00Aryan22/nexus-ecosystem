export const dynamic = "force-dynamic";

// Supabase integration page — requires NEXT_PUBLIC_SUPABASE_URL to be configured.
export default function Page() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Integration</h1>
      <p className="text-muted-foreground">
        Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
        to enable Supabase features.
      </p>
    </div>
  );
}
