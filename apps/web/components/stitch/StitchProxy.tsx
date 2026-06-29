"use client";

import React, { useState } from "react";
import { inspect, launch, sendRequest, fetchWidget } from "@/lib/page-modules/stitch";

type Props = {
  vendorUrl?: string;
};

export function StitchProxy({ vendorUrl }: Props) {
  const [path, setPath] = useState("");
  const [body, setBody] = useState("{\n  \"input\": \"hello\"\n}");
  const [resp, setResp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [widgetHtml, setWidgetHtml] = useState<string | null>(null);

  async function send() {
    setLoading(true);
    setResp(null);
    try {
      const parsed = JSON.parse(body);
      const data = await sendRequest(path, parsed);
      setResp(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setResp(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function inspectVendor() {
    if (!vendorUrl) {
      setResp('No vendor URL provided');
      return;
    }
    setLoading(true);
    setResp(null);
    try {
      const data = await inspect(vendorUrl);
      setResp(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setResp(String(e));
    } finally {
      setLoading(false);
    }
  }

  function launchVendor() {
    if (!vendorUrl) {
      setResp('No vendor URL provided');
      return;
    }
    const endpoint = launch(vendorUrl);
    window.open(endpoint, "_blank");
  }

  async function loadWidget() {
    if (!vendorUrl) {
      setResp('No vendor URL provided');
      return;
    }
    setLoading(true);
    setResp(null);
    setWidgetHtml(null);
    try {
      const data = await fetchWidget(vendorUrl);
      if (typeof data === 'string') {
        setWidgetHtml(data);
      } else if (data instanceof ArrayBuffer) {
        const blob = new Blob([data]);
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else {
        setResp('Unsupported widget response type');
      }
    } catch (e: any) {
      setResp(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 bg-slate-900 rounded-md text-slate-100">
      <h3 className="text-lg font-medium mb-2">Stitch Proxy Test</h3>
      <label className="block mb-1">Path (appended to base)</label>
      <input className="w-full mb-2 p-2 bg-slate-800" value={path} onChange={(e)=>setPath(e.target.value)} placeholder="e.g. v1/requests" />
      <label className="block mb-1">JSON body</label>
      <textarea className="w-full mb-2 p-2 bg-slate-800" rows={6} value={body} onChange={(e)=>setBody(e.target.value)} />
      <div className="flex gap-2">
        <button className="px-3 py-1 bg-indigo-600 rounded" onClick={send} disabled={loading}>{loading? 'Sending...':'Send'}</button>
        <button className="px-3 py-1 bg-amber-600 rounded" onClick={inspectVendor} disabled={loading}>Inspect vendor</button>
        <button className="px-3 py-1 bg-emerald-600 rounded" onClick={loadWidget} disabled={loading}>Load widget</button>
        <button className="px-3 py-1 bg-green-600 rounded" onClick={launchVendor}>Open vendor site</button>
      </div>
      <pre className="mt-3 p-2 bg-slate-800 text-xs overflow-auto">{resp}</pre>
      {widgetHtml ? (
        <div className="mt-4 border bg-white">
          <h4 className="p-2 text-sm font-medium">Widget (fetched via proxy)</h4>
          <iframe title="Stitch widget" srcDoc={widgetHtml} className="w-full h-[720px]" />
        </div>
      ) : null}
    </div>
  );
}

export default StitchProxy;
