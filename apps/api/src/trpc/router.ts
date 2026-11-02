import { initTRPC } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { RouteMeta } from "trpc-docs-generator";
import type { Context } from "./context.js";
import { Permission, roleHasPermission } from "../auth/authorization.js";
import { Audit, AuditStatus } from "../entities/Audit.js";
import { FrameworkVersion } from "../entities/FrameworkVersion.js";
import { User } from "../entities/User.js";
import { SoAEntry } from "../entities/SoAEntry.js";
import { MembershipRole } from "../entities/Membership.js";

const t = initTRPC.context<Context>().meta<RouteMeta>().create();

export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const organizationProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Active organizaton membership required",
    });
  }
  return next({ ctx: { ...ctx, membership: ctx.membership } });
});

export function permissionProcedure(permission: Permission) {
  return organizationProcedure.use(({ ctx, next }) => {
    if (!roleHasPermission(ctx.membership.role, permission)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Insufficient role permissions",
      });
    }
    return next();
  });
}

export const appRouter = t.router({
  healthcheck: publicProcedure
    .meta({
      name: "Health check",
      docs: {
        description: "Checks whether the api is responding",
        tags: ["System"],
        auth: false,
      },
    })
    .output(
      z.object({
        status: z.literal("ok"),
        message: z.string(),
        timestamp: z.string(),
      }),
    )
    .query(() => ({
      status: "ok" as const,
      message: "test",
      timestamp: new Date().toISOString(),
    })),

  listAudits: permissionProcedure(Permission.ReadOrganization)
    .meta({
      name: "List audits",
      docs: {
        description: "Shows all audits for current organization",
        tags: ["Audits"],
        auth: true,
      },
    })
    .output(z.array(z.object({ id: z.uuid(), name: z.string() })))
    .query(async ({ ctx }) => {
      const audits = await ctx.em.find(
        Audit,
        { organization: ctx.membership.organization.id },
        { fields: ["id", "name"] },
      );
      return audits.map(({ id, name }) => ({ id, name }));
    }),

  createAudt: permissionProcedure(Permission.ManageAudits)
    .meta({
      name: "Create audit",
      docs: {
        description: "Creates new audit",
        tags: ["Audits"],
        auth: true,
      },
    })
    .input(
      z.object({
        name: z.string().min(1),
        frameworkVersionId: z.number().int(),
        leadAuditorId: z.uuid(),
        auditType: z.enum(["internal", "external", "other"]),
        startDate: z.coerce.date(),
        dueDate: z.coerce.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const audit = new Audit();
      audit.organization = ctx.membership.organization;
      audit.name = input.name;
      audit.frameworkVersion = await ctx.em.getReference(
        FrameworkVersion,
        input.frameworkVersionId,
      );
      audit.leadAuditor = await ctx.em.getReference(User, input.leadAuditorId);
      audit.startDate = input.startDate;
      audit.dueDate = input.dueDate;
      audit.status = AuditStatus.Draft;
      await ctx.em.flush();
      return { id: audit.id, name: audit.name };
    }),

  listSoA: permissionProcedure(Permission.ReadOrganization).query(
    async ({ ctx }) => {
      return ctx.em.find(
        SoAEntry,
        { organization: ctx.membership.organization },
        {
          fields: [
            "id",
            "isApplicable",
            "justification",
            "implementationStatus",
          ],
        },
      );
    },
  ),

  updateSoA: permissionProcedure(Permission.WriteSoA)
    .input(
      z.object({
        id: z.uuid(),
        isApplicable: z.boolean(),
        justification: z.string(),
        implementationStatus: z.enum([
          "not_implemented",
          "planned",
          "partially_implemented",
          "implemented",
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.em.findOne(SoAEntry, {
        id: input.id,
        organization: ctx.membership.organization.id,
      });
      if (!entry) throw new TRPCError({ code: "NOT_FOUND" });
      if (
        ctx.membership.role === MembershipRole.Contributor &&
        entry.controlOwner?.id !== ctx.user.id
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      entry.isApplicable = input.isApplicable;
      entry.justification = input.justification;
      entry.implementationStatus = input.implementationStatus;
      entry.reviewedAt = new Date();
      await ctx.em.flush();

      return { id: entry.id };
    }),
});

export type AppRouter = typeof appRouter;
