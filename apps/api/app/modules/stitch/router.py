import logging
import time
from typing import Any
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.core.config import settings

router = APIRouter(
    prefix="/stitch",
    tags=["stitch"],
)

logger = logging.getLogger(__name__)

# Holds metadata about the last upstream probes for quick diagnostics in the app.
# Keys: 'request', 'widget', 'inspect' -> each maps to a small dict with
# url/status/headers/timestamp
last_probe: dict[str, Any] = {}

_HEADER_KEYS = ["x-frame-options", "content-security-policy", "content-type"]


class StitchRequest(BaseModel):
    path: str | None = ""
    method: str | None = "POST"
    headers: dict[str, str] | None = None
    body_json: Any | None = None
    text: str | None = None


def _check_host(netloc: str, base_netloc: str) -> None:
    """Raise 403 if netloc is not an allowed Stitch host."""
    allowed = {base_netloc, "stitch.withgoogle.com"}
    if netloc not in allowed and not any(netloc.endswith(h) for h in allowed):
        raise HTTPException(status_code=403, detail="Forbidden host")


def _safe_headers(resp: httpx.Response) -> dict[str, str]:
    try:
        return dict(resp.headers)
    except Exception:
        return {}


@router.post("/request")
async def stitch_request(
    req: StitchRequest,
    _user=Depends(get_current_user),
):
    """Proxy a request to the Stitch API using server-side API key."""
    base = settings.stitch_url.rstrip("/")
    path = req.path.lstrip("/") if req.path else ""
    url = f"{base}/{path}" if path else base

    headers = dict(req.headers or {})
    if settings.stitch_header_name and settings.stitch_api_key:
        headers[settings.stitch_header_name] = settings.stitch_api_key

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.request(
                req.method or "POST",
                url,
                headers=headers,
                json=req.body_json,
                content=(req.text.encode("utf-8") if req.text else None),
            )
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail=str(exc))

    hdrs = _safe_headers(resp)
    last_probe["request"] = {
        "url": url,
        "status": resp.status_code,
        "headers": {k: hdrs.get(k) for k in _HEADER_KEYS if k in hdrs},
        "timestamp": time.time(),
    }
    if resp.status_code >= 400:
        logger.warning(
            "Stitch upstream request %s returned %s (%s)",
            url,
            resp.status_code,
            hdrs,
        )

    content_type = resp.headers.get("content-type", "")
    if "application/json" in content_type:
        return {"status": resp.status_code, "json": resp.json()}
    return {"status": resp.status_code, "text": resp.text}


@router.get("/widget")
async def stitch_widget(
    path: str | None = "",
    raw: bool = False,
    url: str | None = None,
    _user=Depends(get_current_user),
):
    """Proxy a GET request to the Stitch base URL and return raw content."""
    base = settings.stitch_url.rstrip("/")
    base_netloc = urlparse(base).netloc

    if url:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            raise HTTPException(status_code=400, detail="Invalid url parameter")
        _check_host(parsed.netloc, base_netloc)
        fetch_url = url
    else:
        path = path.lstrip("/") if path else ""
        fetch_url = f"{base}/{path}" if path else base

    headers: dict[str, str] = {}
    if settings.stitch_header_name and settings.stitch_api_key:
        headers[settings.stitch_header_name] = settings.stitch_api_key

    async with httpx.AsyncClient(timeout=20.0) as client:
        try:
            resp = await client.get(fetch_url, headers=headers)
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail=str(exc))

    hdrs = _safe_headers(resp)
    if resp.status_code >= 400:
        logger.warning(
            "Stitch widget fetch %s returned %s (%s)",
            fetch_url,
            resp.status_code,
            hdrs,
        )

    content_head: str | bytes = (
        resp.text[:1024]
        if hasattr(resp, "text")
        else (resp.content[:1024] if resp.content else b"")
    )
    last_probe["widget"] = {
        "url": fetch_url,
        "status": resp.status_code,
        "headers": {k: hdrs.get(k) for k in _HEADER_KEYS if k in hdrs},
        "body_head": content_head,
        "timestamp": time.time(),
    }

    content_type = resp.headers.get("content-type") or "application/octet-stream"
    return Response(content=resp.content, media_type=content_type)


@router.get("/inspect")
async def stitch_inspect(
    url: str = Query(..., description="Absolute URL to inspect"),
    _user=Depends(get_current_user),
):
    """Return status and headers from an absolute URL (validates host)."""
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise HTTPException(status_code=400, detail="Invalid url")

    base_netloc = urlparse(settings.stitch_url).netloc
    _check_host(parsed.netloc, base_netloc)

    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
        try:
            resp = await client.get(url, headers={"User-Agent": "Inspector/1.0"})
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail=str(exc))

    hdrs = _safe_headers(resp)
    if resp.status_code >= 400:
        logger.warning("Stitch inspect %s returned %s (%s)", url, resp.status_code, hdrs)

    last_probe["inspect"] = {
        "url": url,
        "status": resp.status_code,
        "headers": {k: hdrs.get(k) for k in _HEADER_KEYS if k in hdrs},
        "timestamp": time.time(),
    }
    norm = {k.lower(): v for k, v in resp.headers.items()}
    return {
        "status": resp.status_code,
        "headers": {k: norm[k] for k in _HEADER_KEYS if k in norm},
    }


@router.get("/launch")
async def stitch_launch(
    url: str = Query(..., description="Absolute vendor URL to open"),
    _user=Depends(get_current_user),
):
    """Redirect the browser to the vendor URL."""
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise HTTPException(status_code=400, detail="Invalid url")

    base_netloc = urlparse(settings.stitch_url).netloc
    _check_host(parsed.netloc, base_netloc)
    return RedirectResponse(url)


@router.get("/debug-last")
async def stitch_debug_last(
    _user=Depends(get_current_user),
):
    """Return the last upstream probe snapshots."""
    return last_probe
