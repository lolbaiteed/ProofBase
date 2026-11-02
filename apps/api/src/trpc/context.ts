import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { orm } from "../utils/database.js";
import { getAuthenticatedUser } from "../auth/auth.plugin.js";
import { Membership, MembershipStatus } from "../entities/Membership.js";

export async function createContext({ req }: CreateFastifyContextOptions) {
  const user = await getAuthenticatedUser(req);
  const membership = user
    ? await orm.em.findOne(Membership, {
        user: user.id,
        organization: user.organization.id,
        status: MembershipStatus.Active,
      })
    : null;
  return {
    em: orm.em,
    user,
    membership,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
