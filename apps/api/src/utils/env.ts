import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

const rootEnvPath = fileURLToPath(new URL("../../../../.env", import.meta.url));

dotenv.config({ path: rootEnvPath });

export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is not configured");
  }

  return url;
}
