import os
import socket
import sys
from urllib.request import urlopen

REQUIRED_HOSTS = [
    ("localhost", 5432),
    ("localhost", 6379),
    ("localhost", 8001),
]


def check_port(host: str, port: int) -> tuple[bool, str]:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(2)
        result = sock.connect_ex((host, port))
        return result == 0, f"{host}:{port} -> {'open' if result == 0 else 'closed'}"


def check_http(url: str) -> tuple[bool, str]:
    try:
        with urlopen(url, timeout=3) as response:
            return response.status < 500, f"{url} -> HTTP {response.status}"
    except Exception as exc:  # pragma: no cover - diagnostic script
        if hasattr(exc, "code") and getattr(exc, "code") is not None and getattr(exc, "code") < 500:
            return True, f"{url} -> HTTP {exc.code}"
        return False, f"{url} -> {exc}"


if __name__ == "__main__":
    print("[Phase 2] Infrastructure verification")
    failed = False
    for host, port in REQUIRED_HOSTS:
        ok, message = check_port(host, port)
        print(message)
        if not ok:
            failed = True

    if os.getenv("CHROMA_HOST"):
        host = os.getenv("CHROMA_HOST", "localhost")
        port = os.getenv("CHROMA_PORT", "8001")
        chroma_url = f"http://{host}:{port}"
    else:
        chroma_url = "http://localhost:8001"

    http_ok, http_message = check_http(chroma_url)
    print(http_message)
    if not http_ok:
        failed = True

    if failed:
        print("Phase 2 verification: FAILED")
        sys.exit(1)

    print("Phase 2 verification: PASSED")
