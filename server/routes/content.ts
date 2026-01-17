import { Router } from "express";
import multer from "multer";
import type { FileStore } from "../store/file-store.js";
import type { StoredAttachment, StoredPage, StoredVersion } from "../store/types.js";

type PageRequestBody = {
  title?: string;
  space?: { key?: string };
  ancestors?: { id: string; title?: string }[];
  body?: {
    storage: {
      value: string;
      representation: string;
    };
  };
  version?: {
    number?: number;
    message?: string;
    minorEdit?: boolean;
  };
};

const upload = multer();

export function createContentRouter(store: FileStore): Router {
  const router = Router();

  router.get("/", (req, res) => {
    const spaceKey = req.query.spaceKey as string | undefined;
    const title = req.query.title as string | undefined;
    const cql = req.query.cql as string | undefined;

    let pages: StoredPage[] = [];

    if (spaceKey && title) {
      const page = store
        .listPages(spaceKey)
        .find((entry) => entry.title.toLowerCase() === title.toLowerCase());
      pages = page ? [page] : [];
    } else if (spaceKey) {
      pages = store.listPages(spaceKey);
    } else if (cql) {
      const match = cql.match(/space=([A-Z0-9]+)/i);
      if (match) {
        pages = store.listPages(match[1]);
      }
    }

    res.json({ results: pages.map((page) => toApiPage(page)), size: pages.length });
  });

  router.get("/:id", (req, res) => {
    const pageId = req.params.id;
    const versionQuery = req.query.version as string | undefined;
    const page = store.getPage(pageId);

    if (!page) {
      res.status(404).json({ message: "Not found" });
      return;
    }

    if (versionQuery) {
      const version = Number(versionQuery);
      const versioned = findVersion(store, pageId, version);
      if (!versioned) {
        res.status(404).json({ message: "Version not found" });
        return;
      }
      res.json(toApiPage(versioned));
      return;
    }

    res.json(toApiPage(page));
  });

  router.post("/", (req, res) => {
    const body = req.body as PageRequestBody;
    const spaceKey = body?.space?.key;
    if (!spaceKey) {
      res.status(400).json({ message: "Missing space key" });
      return;
    }

    const version = createVersion(1, body?.version?.message, body?.version?.minorEdit);
    const created = store.createPage(
      {
        type: "page",
        status: "current",
        title: body.title ?? "Untitled",
        spaceKey,
        ancestors: body.ancestors ?? [],
        body: body.body ?? { storage: { value: "", representation: "storage" } },
      },
      version,
    );

    store.ensureSpace(spaceKey);
    res.status(200).json(toApiPage(created));
  });

  router.put("/:id", (req, res) => {
    const pageId = req.params.id;
    const page = store.getPage(pageId);
    if (!page) {
      res.status(404).json({ message: "Not found" });
      return;
    }

    const conflictPolicy = (req.query.conflictPolicy as string | undefined) ?? "abort";
    const body = req.body as PageRequestBody;
    const nextVersion = body?.version?.number ?? page.version.number + 1;

    if (conflictPolicy === "abort" && nextVersion <= page.version.number) {
      res.status(409).json({ message: "Version conflict" });
      return;
    }

    store.addVersion(pageId, page);

    const updated: StoredPage = {
      ...page,
      title: body.title ?? page.title,
      body: body.body ?? page.body,
      version: createVersion(nextVersion, body?.version?.message, body?.version?.minorEdit),
    };

    store.updatePage(pageId, updated);
    res.json(toApiPage(updated));
  });

  router.delete("/:id", (req, res) => {
    const pageId = req.params.id;
    const page = store.getPage(pageId);
    if (page) {
      store.deletePage(pageId);
      res.status(204).send();
      return;
    }

    const attachment = store.findAttachmentById(pageId);
    if (attachment) {
      store.deleteAttachment(attachment.pageId, attachment.id);
      res.status(204).send();
      return;
    }

    res.status(404).json({ message: "Not found" });
  });

  router.get("/:id/history", (req, res) => {
    const pageId = req.params.id;
    const versions = store.getVersions(pageId);
    const current = store.getPage(pageId);
    if (!current) {
      res.status(404).json({ message: "Not found" });
      return;
    }
    const lastUpdated = current.version;
    const previousVersion =
      versions.length > 0 ? versions[versions.length - 1]?.version : undefined;
    res.json({ lastUpdated, previousVersion });
  });

  router.get("/:id/version", (req, res) => {
    const pageId = req.params.id;
    const versions = store.getVersions(pageId).map((page) => page.version);
    const current = store.getPage(pageId);
    if (current) {
      versions.push(current.version);
    }
    res.json({ results: versions, size: versions.length });
  });

  router.get("/:id/version/:num", (req, res) => {
    const pageId = req.params.id;
    const versionNumber = Number(req.params.num);
    const versioned = findVersion(store, pageId, versionNumber);
    if (!versioned) {
      res.status(404).json({ message: "Not found" });
      return;
    }
    res.json(toApiPage(versioned));
  });

  router.get("/:id/child/page", (req, res) => {
    const pageId = req.params.id;
    const pages = Object.values(store.listPages(store.getPage(pageId)?.spaceKey ?? "")).filter(
      (page) => page.ancestors.some((ancestor) => ancestor.id === pageId),
    );
    res.json({ results: pages.map((page) => toApiPage(page)), size: pages.length });
  });

  router.get("/:id/descendant/page", (req, res) => {
    const pageId = req.params.id;
    const pages = Object.values(store.listPages(store.getPage(pageId)?.spaceKey ?? "")).filter(
      (page) => page.ancestors.some((ancestor) => ancestor.id === pageId),
    );
    res.json({ results: pages.map((page) => toApiPage(page)), size: pages.length });
  });

  router.get("/:id/child/attachment", (req, res) => {
    const pageId = req.params.id;
    const filename = req.query.filename as string | undefined;
    let attachments = store.getAttachments(pageId);
    if (filename) {
      attachments = attachments.filter((attachment) => attachment.title === filename);
    }
    res.json({ results: attachments.map((att) => toApiAttachment(att)), size: attachments.length });
  });

  router.get("/:id/child/attachment/:attId/download", (req, res) => {
    const pageId = req.params.id;
    const attachmentId = req.params.attId;
    const attachment = store.getAttachment(pageId, attachmentId);
    if (!attachment) {
      res.status(404).send("Not found");
      return;
    }
    res.set("Content-Type", attachment.mediaType);
    res.send(Buffer.from(attachment.data, "base64"));
  });

  router.post("/:id/child/attachment", upload.single("file"), (req, res) => {
    if (req.header("X-Atlassian-Token") !== "nocheck") {
      res.status(403).json({ message: "XSRF check failed" });
      return;
    }
    const pageId = req.params.id;
    const file = req.file;
    if (!file) {
      res.status(400).json({ message: "Missing file" });
      return;
    }
    const attachment = createAttachment(
      store.nextAttachmentId(),
      pageId,
      file.originalname,
      file.mimetype,
      file.buffer,
    );
    store.saveAttachment(attachment);
    res.json({ results: [toApiAttachment(attachment)] });
  });

  router.post("/:id/child/attachment/:attId/data", upload.single("file"), (req, res) => {
    if (req.header("X-Atlassian-Token") !== "nocheck") {
      res.status(403).json({ message: "XSRF check failed" });
      return;
    }
    const pageId = req.params.id;
    const attachmentId = req.params.attId;
    const file = req.file;
    if (!file) {
      res.status(400).json({ message: "Missing file" });
      return;
    }
    const existing = store.getAttachment(pageId, attachmentId);
    if (!existing) {
      res.status(404).json({ message: "Not found" });
      return;
    }
    const updated: StoredAttachment = {
      ...existing,
      title: existing.title,
      data: file.buffer.toString("base64"),
      size: file.size,
      version: createVersion(existing.version.number + 1),
    };
    store.saveAttachment(updated);
    res.json({ results: [toApiAttachment(updated)] });
  });

  router.get("/:id/label", (req, res) => {
    const pageId = req.params.id;
    const labels = store.getLabels(pageId);
    res.json({ results: labels.map((label) => ({ prefix: "global", name: label })) });
  });

  router.post("/:id/label", (req, res) => {
    const pageId = req.params.id;
    const labels = req.body as Array<{ name: string }>;
    const existing = new Set(store.getLabels(pageId));
    for (const label of labels ?? []) {
      if (label.name) {
        existing.add(label.name);
      }
    }
    store.setLabels(pageId, Array.from(existing));
    res.json(Array.from(existing).map((name) => ({ prefix: "global", name })));
  });

  router.delete("/:id/label/:name", (req, res) => {
    const pageId = req.params.id;
    const name = decodeURIComponent(req.params.name);
    const labels = store.getLabels(pageId).filter((label) => label !== name);
    store.setLabels(pageId, labels);
    res.status(204).send();
  });

  return router;
}

function toApiPage(page: StoredPage): Record<string, unknown> {
  return {
    id: page.id,
    type: page.type,
    status: page.status,
    title: page.title,
    space: { key: page.spaceKey, name: page.spaceKey },
    version: page.version,
    ancestors: page.ancestors,
    body: page.body,
    _links: {
      webui: `/wiki/spaces/${page.spaceKey}/pages/${page.id}`,
      self: `/wiki/rest/api/content/${page.id}`,
    },
  };
}

function toApiAttachment(attachment: StoredAttachment): Record<string, unknown> {
  return {
    id: attachment.id,
    type: "attachment",
    status: "current",
    title: attachment.title,
    version: attachment.version,
    extensions: {
      fileSize: attachment.size,
    },
    _links: {
      download: `/wiki/rest/api/content/${attachment.pageId}/child/attachment/${attachment.id}/download`,
    },
  };
}

function createVersion(number: number, message?: string, minorEdit?: boolean): StoredVersion {
  return {
    number,
    by: { displayName: "Test User", email: "test@example.com" },
    when: new Date().toISOString(),
    message: message ?? "",
    minorEdit: minorEdit ?? false,
  };
}

function findVersion(store: FileStore, pageId: string, version: number): StoredPage | undefined {
  const current = store.getPage(pageId);
  if (current && current.version.number === version) {
    return current;
  }
  return store.getVersions(pageId).find((page) => page.version.number === version);
}

function createAttachment(
  id: string,
  pageId: string,
  filename: string,
  mediaType: string,
  data: Buffer,
): StoredAttachment {
  return {
    id,
    pageId,
    title: filename,
    mediaType,
    data: data.toString("base64"),
    size: data.length,
    version: createVersion(1),
  };
}
