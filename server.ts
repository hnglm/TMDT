import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { apiRouter } from "./server/api/routes";
import { EnvConfig } from "./server/infrastructure/config/EnvConfig";

const app = express();
const PORT = EnvConfig.port;

// Base middlewares
app.use(express.json({ limit: "20mb" }));

// Tiêm toàn bộ định tuyến API từ Composition Root
app.use("/api", apiRouter);

// Cấu hình tích hợp máy chủ tĩnh (Vite)
async function main() {
  if (EnvConfig.nodeEnv !== "production") {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[LuxeHome Server] Chạy thành công chế độ Clean Architecture trên cổng ${PORT}`);
  });
}

main().catch((err) => {
  console.error("Lỗi khởi động máy chủ LuxeHome:", err);
});
