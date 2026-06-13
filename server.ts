import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { apiRouter } from "./src/api/routes.ts"; 

const app = express();
// Sử dụng trực tiếp process.env thay vì EnvConfig để tránh lỗi thiếu file
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Base middlewares
app.use(express.json({ limit: "20mb" }));

// Tiêm toàn bộ định tuyến API
app.use("/api", apiRouter);

// Cấu hình tích hợp máy chủ tĩnh (Vite)
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
    console.log(`[LuxeHome Server] Máy chủ proxy hoạt động thành công trên cổng ${PORT}`);
  });
}

main().catch((err) => {
  console.error("Lỗi khởi động máy chủ LuxeHome:", err);
});