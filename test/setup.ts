import type { Server } from "node:http";
import { afterAll, beforeAll } from "vitest";
import { startTestServer, stopServer } from "../server/index.js";

let server: Server | null = null;

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  const result = await startTestServer({ port: 0, dataDir: "server-data-test" });
  server = result.server;
  process.env.CONFLUENCE_TEST_BASE_URL = `http://localhost:${result.port}`;
});

afterAll(async () => {
  if (server) {
    await stopServer(server);
  }
});
