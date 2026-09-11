"""Small, dependency-free LAN server for the Novelist static application."""

from __future__ import annotations

import os
import socket
import struct
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parent
PUBLIC_FILES = {"/", "/index.html", "/app.js", "/styles.css"}


class NovelistHandler(SimpleHTTPRequestHandler):
    """Serve only application assets, rather than exposing the repository."""

    def translate_path(self, path: str) -> str:
        clean_path = urlsplit(path).path
        if clean_path == "/":
            clean_path = "/index.html"
        if clean_path not in PUBLIC_FILES:
            return str(ROOT / "__not_found__")
        return str(ROOT / clean_path.lstrip("/"))

    def end_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


def lan_addresses(port: int) -> list[str]:
    """Return useful private-network URLs for the startup message."""
    addresses: set[str] = set()
    try:
        for result in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            address = result[4][0]
            if not address.startswith("127."):
                addresses.add(address)
    except socket.gaierror:
        pass
    try:
        # A UDP connect does not send traffic; it asks the OS which LAN-facing
        # address it would use for an outbound route.
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as probe:
            probe.connect(("192.0.2.1", 80))
            address = probe.getsockname()[0]
            if not address.startswith("127."):
                addresses.add(address)
    except OSError:
        pass
    try:
        import fcntl

        for _, interface in socket.if_nameindex():
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as probe:
                packed = struct.pack("256s", interface.encode()[:15])
                address = socket.inet_ntoa(fcntl.ioctl(probe.fileno(), 0x8915, packed)[20:24])
                if not address.startswith("127."):
                    addresses.add(address)
    except (ImportError, OSError):
        pass
    return [f"http://{address}:{port}" for address in sorted(addresses)]


def main() -> None:
    host = os.environ.get("NOVELIST_HOST", "0.0.0.0")
    port = int(os.environ.get("NOVELIST_PORT", "4173"))
    server = ThreadingHTTPServer((host, port), NovelistHandler)
    print(f"Novelist is listening on http://localhost:{port}", flush=True)
    if host in {"0.0.0.0", "::"}:
        for address in lan_addresses(port):
            print(f"LAN: {address}", flush=True)
    print("Press Ctrl+C to stop.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
