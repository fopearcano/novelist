import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer

from server import NovelistHandler, lan_addresses


class QuietHandler(NovelistHandler):
    def log_message(self, _format, *args):
        pass


class ServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), QuietHandler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base_url = f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def test_serves_the_application_with_security_headers(self):
        with urllib.request.urlopen(f"{self.base_url}/") as response:
            body = response.read().decode()
            self.assertIn("novelist", body)
            self.assertEqual(response.headers["X-Content-Type-Options"], "nosniff")

    def test_does_not_expose_repository_files(self):
        with self.assertRaises(urllib.error.HTTPError) as error:
            urllib.request.urlopen(f"{self.base_url}/.git/config")
        self.assertEqual(error.exception.code, 404)
        error.exception.close()

    def test_lan_urls_include_the_requested_port(self):
        self.assertTrue(all(url.endswith(":7654") for url in lan_addresses(7654)))


if __name__ == "__main__":
    unittest.main()
