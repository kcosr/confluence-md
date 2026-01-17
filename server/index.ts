import { type Server, createServer } from "node:http";
import { createApp } from "./app.js";
import { FileStore } from "./store/file-store.js";

export interface ServerOptions {
  port?: number;
  dataDir?: string;
}

export async function startServer(options: ServerOptions = {}): Promise<Server> {
  const dataDir = options.dataDir ?? "server-data";
  const store = new FileStore(dataDir);
  await store.load();
  const app = createApp(store);
  const server = createServer(app);

  const port = options.port ?? 3000;
  await new Promise<void>((resolve) => {
    server.listen(port, resolve);
  });

  return server;
}

export async function startTestServer(
  options: ServerOptions = {},
): Promise<{ server: Server; port: number }> {
  const server = await startServer({ ...options, port: options.port ?? 0 });
  const address = server.address();
  if (address && typeof address === "object") {
    return { server, port: address.port };
  }
  return { server, port: options.port ?? 0 };
}

export async function stopServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function run() {
  const args = process.argv.slice(2);
  const portArg = getArg(args, "--port");
  const dataArg = getArg(args, "--data");
  const port = portArg ? Number(portArg) : 3000;

  await startServer({ port, dataDir: dataArg ?? "server-data" });
  // eslint-disable-next-line no-console
  console.log(`Fake Confluence server running on http://localhost:${port}`);
}

function getArg(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) {
    return undefined;
  }
  return args[index + 1];
}

if (process.env.NODE_ENV !== "test") {
  run().catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });
}
