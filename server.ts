import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// 1. Cấu hình đọc Body JSON trước để Express hiểu dữ liệu từ Client gửi lên
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// 2. CẤU HÌNH PROXY: Chuyển tiếp request /api sang Backend .NET Core (cổng 5200)
app.use(
  "/api",
  createProxyMiddleware({
    target: "http://localhost:5200", // Cổng chạy thực tế của Backend .NET
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq, req: any) => {
        // Khắc phục triệt để lỗi mất dữ liệu Body (Email/Password) khi đi qua Express Middleware
        if (req.body && Object.keys(req.body).length) {
          const bodyData = JSON.stringify(req.body);
          proxyReq.setHeader("Content-Type", "application/json");
          proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        }
      }
    }
  })
);

// 3. Cấu hình tích hợp máy chủ tĩnh (Vite)
async function main() {
  if (NODE_ENV !== "production") {
    // Chế độ phát triển (Phối hợp Vite middleware tự động làm mới mã client)
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Chế độ sản xuất (Phân phối thư mục tĩnh build sẵn)
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`[LuxeHome Server] Máy chủ proxy hoạt động thành công trên cổng ${PORT} -> Đã kết nối Backend 5200`);
  });
}

main().catch((err) => {
  console.error("Lỗi khởi động máy chủ LuxeHome:", err);
});