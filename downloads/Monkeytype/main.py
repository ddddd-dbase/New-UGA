from http.server import SimpleHTTPRequestHandler, HTTPServer
import errno

class QuiteHandler(SimpleHTTPRequestHandler):
    def handle(self):
        try:
            super().handle()
        except OSError as e:
            if e.errno == errno.WSAECONNABORTED or e.errno == 10053:
                self.log_message("Connection aborted by host machine.")
            elif e.errno == errno.WSAECONNRESET or e.errno == 10054:
                self.log_message("Connection forcefully closed by remote host.")
            else:
                raise

    def log_message(self, format, *args):
        print(f"[Server] {format % args}")


def run(server_class=HTTPServer, handler_class=SimpleHTTPRequestHandler):
    httpd = HTTPServer(("127.0.0.1", 80), QuiteHandler)
    print("Starting web server at http://localhost")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("Stopping web server.")
        httpd.server_close()
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        httpd.server_close()

if __name__ == "__main__":
    run()
