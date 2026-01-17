import express from "express";
import { authMiddleware } from "./middleware/auth.js";
import { createContentRouter } from "./routes/content.js";
import { createSpaceRouter } from "./routes/space.js";
import type { FileStore } from "./store/file-store.js";

export function createApp(store: FileStore): express.Express {
  const app = express();

  app.use(express.json({ limit: "10mb" }));
  app.use(authMiddleware);

  app.use("/wiki/rest/api/content", createContentRouter(store));
  app.use("/wiki/rest/api/space", createSpaceRouter(store));

  app.post("/wiki/rest/api/contentbody/convert/:to", (req, res) => {
    const to = req.params.to;
    const body = req.body as { value: string; representation: string };
    if (!body?.value) {
      res.status(400).json({ message: "Missing body value" });
      return;
    }
    res.json({ value: body.value, representation: to });
  });

  return app;
}
