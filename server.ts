import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { saveHistory, getHistory, deleteHistory } from "./src/services/db.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Aura Mystic API is running" });
  });

  app.get("/api/daily-vibe", (req, res) => {
    const vibes = [
      "Hôm nay là ngày tuyệt vời để bắt đầu những dự định mới. Năng lượng vũ trụ đang ủng hộ bạn.",
      "Hãy dành thời gian lắng nghe tiếng nói bên trong. Sự tĩnh lặng sẽ mang lại câu trả lời.",
      "Một cơ hội bất ngờ có thể xuất hiện. Hãy mở lòng đón nhận những điều mới mẻ.",
      "Năng lượng của sự sáng tạo đang dồi dào. Đừng ngần ngại thể hiện bản thân.",
      "Hãy chú ý đến những giấc mơ của bạn. Chúng mang theo những thông điệp quan trọng.",
      "Sự kiên trì sẽ mang lại quả ngọt. Đừng bỏ cuộc khi chỉ còn một bước nữa là tới đích.",
      "Hôm nay là ngày của sự kết nối. Hãy dành thời gian cho những người thân yêu."
    ];
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const vibe = vibes[dayOfYear % vibes.length];
    res.json({ vibe });
  });

  app.get("/api/history", (req, res) => {
    try {
      const history = getHistory();
      res.json(history);
    } catch (error) {
      console.error("History fetch error:", error);
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  app.post("/api/history", (req, res) => {
    try {
      const result = saveHistory(req.body);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
      console.error("History save error:", error);
      res.status(500).json({ error: "Failed to save history" });
    }
  });

  app.delete("/api/history/:id", (req, res) => {
    try {
      deleteHistory(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("History delete error:", error);
      res.status(500).json({ error: "Failed to delete history" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
