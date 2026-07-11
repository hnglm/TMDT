import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createServer as createHttpServer } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

const NGROK_HOST = " https://kenny-ungraceful-tatum.ngrok-free.dev";

// Tạo HTTP server chung cho Express + Vite HMR
const httpServer = createHttpServer(app);

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Sửa cảnh báo Google popup:
// Cross-Origin-Opener-Policy policy would block the window.closed call
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

// Chặn lỗi favicon.ico 404
app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

// Proxy /api sang backend .NET
app.use(
  "/api",
  createProxyMiddleware({
    target: "http://127.0.0.1:5200/api",
    changeOrigin: true,
    timeout: 30000,
    proxyTimeout: 30000,

    on: {
      proxyReq: (proxyReq, req: any) => {
        if (req.body && Object.keys(req.body).length) {
          const bodyData = JSON.stringify(req.body);

          proxyReq.setHeader("Content-Type", "application/json");
          proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        }
      },

      error: (err, req, res: any) => {
        console.error("Proxy lỗi sang backend .NET:", err.message);

        if (!res.headersSent) {
          res.writeHead(502, { "Content-Type": "application/json" });
        }

        res.end(
          JSON.stringify({
            message: "Không kết nối được backend .NET tại cổng 5200",
            detail: err.message,
          })
        );
      },
    },
  })
);

async function main() {
  if (NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer,
          protocol: "wss",
          host: NGROK_HOST,
          clientPort: 443,
        },
      },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");

    app.use(express.static(distPath));

    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(Number(PORT), "0.0.0.0", () => {
    console.log(
      `[LuxeHome Server] Proxy chạy tại cổng ${PORT} -> Backend http://127.0.0.1:5200/api`
    );
  });
}

main().catch((err) => {
  console.error("Lỗi khởi động máy chủ LuxeHome:", err);
});