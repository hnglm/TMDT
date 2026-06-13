import { Router, Request, Response } from "express";

export const apiRouter = Router();

// Địa chỉ của máy chủ .NET Backend (dựa theo cấu hình trong Program.cs của bạn)
const DOTNET_BACKEND_URL = "http://localhost:5000";

// 1. Proxy cho tính năng Chatbot AI
apiRouter.post("/chat", async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${DOTNET_BACKEND_URL}/api/Chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("[Node Proxy] Lỗi kết nối C# Backend (/api/Chat):", error);
    res.status(500).json({ error: "Mất kết nối đến hệ thống Backend LuxeHome (.NET)." });
  }
});

// 2. Proxy cho tính năng Phân tích Hình ảnh AI
apiRouter.post("/image-search", async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${DOTNET_BACKEND_URL}/api/ImageSearch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("[Node Proxy] Lỗi kết nối C# Backend (/api/ImageSearch):", error);
    res.status(500).json({ error: "Mất kết nối đến hệ thống Backend LuxeHome (.NET)." });
  }
});

// 3. Đường dẫn kiểm tra trạng thái máy chủ (Health check)
apiRouter.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", message: "Node.js Proxy đang hoạt động bình thường!" });
});