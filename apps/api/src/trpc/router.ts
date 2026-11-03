import { initTRPC } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { RouteMeta } from "trpc-docs-generator";
import type { Context } from "./context.js";
import { roleHasPermission } from "../auth/authorization.js";
import { Audit } from "../entities/Audit.js";
import { FrameworkVersion } from "../entities/FrameworkVersion.js";
import { User } from "../entities/User.js";
import { SoAEntry } from "../entities/SoAEntry.js";
import { Assessment } from "../entities/Assessment.js";
import { Finding } from "../entities/Finding.js";
import {
  Permission,
  FindingSeverity,
  FindingStatus,
  ImplementationStatus,
  AssessmentStatus,
  AuditStatus,
  MembershipRole,
} from "@ProofBase/shared/enums.js";
import { uuidIdSchema } from "@ProofBase/shared/types.js";
import { Evidence } from "../entities/Evidence.js";

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
        leadAuditorId: uuidIdSchema,
        auditType: z.enum(["internal", "external", "other"]),
        startDate: z.coerce.date(),
        dueDate: z.coerce.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const audit = new Audit();
      audit.organization = ctx.membership.organization;
      audit.name = input.name;
      audit.frameworkVersion = ctx.em.getReference(
        FrameworkVersion,
        input.frameworkVersionId,
      );
      audit.leadAuditor = ctx.em.getReference(User, input.leadAuditorId);
      audit.startDate = input.startDate;
      audit.dueDate = input.dueDate;
      audit.status = AuditStatus.Draft;
      await ctx.em.flush();
      return { id: audit.id, name: audit.name };
    }),

  listSoA: permissionProcedure(Permission.ReadOrganization)
    .meta({
      name: "List SoA",
      docs: {
        description: "Shows all existed SoA for organization",
        tags: ["SoA"],
        auth: true,
      },
    })
    .query(async ({ ctx }) => {
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
    }),

  updateSoA: permissionProcedure(Permission.WriteSoA)
    .meta({
      name: "Update SoA",
      docs: {
        description: "Updates selected SoA for organization",
        tags: ["SoA"],
        auth: true,
      },
    })
    .input(
      z.object({
        id: uuidIdSchema,
        isApplicable: z.boolean(),
        justification: z.string(),
        implementationStatus: z.enum(ImplementationStatus),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.em.findOne(SoAEntry, {
        id: input.id,
        organization: ctx.membership.organization,
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
  listAssesments: permissionProcedure(Permission.ReadOrganization)
    .meta({
      name: "List assessments",
      docs: {
        description: "Shows all assessments for current organization",
        tags: ["Assessments"],
        auth: true,
      },
    })
    .query(async ({ ctx }) => {
      return ctx.em.find(
        Assessment,
        { audit: { organization: ctx.membership.organization.id } },
        { fields: ["id", "status", "notes", "audit", "requirement"] },
      );
    }),

  updateAssessment: permissionProcedure(Permission.WriteAssessments)
    .meta({
      name: "Update assessment",
      docs: {
        description: "Updates selected assessment for organization",
        tags: ["Assessments"],
        auth: true,
      },
    })
    .input(
      z.object({
        id: uuidIdSchema,
        status: z.enum(AssessmentStatus),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const assessment = await ctx.em.findOne(
        Assessment,
        {
          id: input.id,
          audit: { organization: ctx.membership.organization.id },
        },
        { populate: ["accessor"] },
      );
      if (!assessment) throw new TRPCError({ code: "NOT_FOUND" });

      if (
        ctx.membership.role === MembershipRole.Contributor &&
        assessment.accessor?.id !== ctx.user.id
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      assessment.status = input.status;
      assessment.notes = input.notes;
      assessment.accessor = ctx.user;
      await ctx.em.flush();

      return { id: assessment.id };
    }),
  listFindings: permissionProcedure(Permission.ReadOrganization)
    .meta({
      name: "List findings",
      docs: {
        description: "Shows all existing findings for organization",
        tags: ["Findings"],
        auth: true,
      },
    })
    .query(async ({ ctx }) => {
      return ctx.em.find(Finding, {
        assessment: { audit: { organization: ctx.membership.organization.id } },
      });
    }),
  createFinding: permissionProcedure(Permission.WriteFindings)
    .meta({
      name: "Create finding",
      docs: {
        description: "Creates new findig to current organization",
        tags: ["Findings"],
        auth: true,
      },
    })
    .input(
      z.object({
        assessmentId: uuidIdSchema,
        title: z.string().min(1),
        description: z.string().optional(),
        severity: z.enum(FindingSeverity),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const assessment = await ctx.em.findOne(Assessment, {
        id: input.assessmentId,
        audit: { organization: ctx.membership.organization.id },
      });

      if (!assessment) throw new TRPCError({ code: "NOT_FOUND" });

      if (
        ctx.membership.role === MembershipRole.Contributor &&
        assessment.accessor?.id !== ctx.user.id
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const finding = new Finding();
      finding.assessment = assessment;
      finding.title = input.title;
      finding.description = input.description;
      finding.severity = input.severity;
      finding.status = FindingStatus.Open;
      finding.assignedTo = ctx.user;
      finding.identifiedAt = new Date();
      await ctx.em.flush();

      return { id: finding.id };
    }),

  listEvidence: permissionProcedure(Permission.ReadOrganization)
    .meta({
      name: "List evidences",
      docs: {
        description: "Shows all evidences for current organization",
        tags: ["Evidences"],
        auth: true,
      },
    })
    .query(async ({ ctx }) => {
      return ctx.em.find(Evidence, {
        assessment: { audit: { organization: ctx.membership.organization.id } },
      });
    }),

  createEvidence: permissionProcedure(Permission.WriteEvidence)
    .meta({
      name: "Create evidence",
      docs: {
        description: "Creates evidence for current organization",
        tags: ["Evidences"],
        auth: true,
      },
    })
    .input(
      z.object({
        assessmentId: uuidIdSchema,
        title: z.string().min(1),
        description: z.string().optional(),
        mimeType: z.string().min(1).max(150),
        fileSize: z.number().int().positive(),
        capturedAt: z.coerce.date(),
        expiresAt: z.coerce.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const assessment = await ctx.em.findOne(Assessment, {
        id: input.assessmentId,
        audit: { organization: ctx.membership.organization.id },
      });
      if (!assessment) throw new TRPCError({ code: "NOT_FOUND" });

      if (
        ctx.membership.role === MembershipRole.Contributor &&
        assessment.accessor?.id !== ctx.user.id
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const evidence = new Evidence();
      evidence.assessment = assessment;
      evidence.uploadedBy = ctx.user;
      evidence.title = input.title;
      evidence.description = input.description;
      evidence.mimeType = input.mimeType;
      evidence.fileSize = input.fileSize;
      evidence.capturedAt = input.capturedAt;
      evidence.expiresAt = input.expiresAt;
      await ctx.em.flush();
      return { id: evidence.id };
    }),
});

export type AppRouter = typeof appRouter;
