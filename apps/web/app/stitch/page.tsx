import StitchProxy from "@/components/stitch/StitchProxy";
import { vendorUrl } from "@/lib/page-modules/stitch";

export const metadata = {
  title: "Stitch UI",
};

export default function Page() {
  // Prefer redirect/open-in-browser flow because some vendor pages block embedding.
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Stitch Integration</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <StitchProxy vendorUrl={vendorUrl} />
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Vendor UI</h3>
          <p className="text-sm mb-2">If embedding fails due to X-Frame-Options/CSP or authentication, use &quot;Open vendor site&quot; in the proxy to open the vendor site in your browser session.</p>
        </div>
      </div>
    </div>
  );
}
