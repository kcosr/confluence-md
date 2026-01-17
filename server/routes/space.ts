import { Router } from "express";
import type { FileStore } from "../store/file-store.js";

export function createSpaceRouter(store: FileStore): Router {
  const router = Router();

  router.get("/:key", (req, res) => {
    const key = req.params.key;
    const space = store.getSpace(key) ?? store.ensureSpace(key);
    res.json({
      key: space.key,
      name: space.name,
      homepage: space.homepageId ? { id: space.homepageId } : undefined,
    });
  });

  router.get("/:key/content", (req, res) => {
    const key = req.params.key;
    const pages = store.listPages(key);
    res.json({ results: pages, size: pages.length });
  });

  return router;
}
