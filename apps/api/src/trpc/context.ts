import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { orm } from "../utils/database.js";
import { getAuthenticatedUser } from "../auth/auth.plugin.js";

export async function createContext({ req }: CreateFastifyContextOptions) {
  return {
    em: orm.em,
    user: await getAuthenticatedUser(req),
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
