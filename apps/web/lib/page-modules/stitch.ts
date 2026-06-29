export const vendorUrl = "https://stitch.withgoogle.com/projects/9208207649661020246?pli=1";

export function inspectEndpoint(url?: string) {
  const target = url ?? vendorUrl;
  return `/api/v1/stitch/inspect?url=${encodeURIComponent(target)}`;
}

export function launchEndpoint(url?: string) {
  const target = url ?? vendorUrl;
  return `/api/v1/stitch/launch?url=${encodeURIComponent(target)}`;
}

export async function sendRequest(path: string, json?: any, method = 'POST') {
  const body = { path, method, json };
  const res = await fetch(`/api/v1/stitch/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return { status: res.status, text: await res.text() };
}

export async function inspect(url?: string) {
  const endpoint = inspectEndpoint(url);
  const res = await fetch(endpoint, { headers: { Accept: 'application/json' } });
  return res.json();
}

export function launch(url?: string) {
  const endpoint = launchEndpoint(url);
  // leave navigation to caller
  return endpoint;
}

export async function fetchWidget(url?: string) {
  const endpoint = `/api/v1/stitch/widget${url ? `?url=${encodeURIComponent(url)}` : ''}`;
  const res = await fetch(endpoint);
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('text') || ct.includes('html')) return res.text();
  return res.arrayBuffer();
}
