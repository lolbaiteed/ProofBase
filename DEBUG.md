listAudits: permissionProcedure(Permission.ReadOrganization)
  .output(z.array(z.object({ id: z.uuid(), name: z.string() })))
  .query(async ({ ctx }) => {
    const audits = await ctx.em.find(
      Audit,
      { organization: ctx.membership.organization.id },
      { fields: ["id", "name"] },
    );
    return audits.map(({ id, name }) => ({ id, name }));
  }),

createAudit: permissionProcedure(Permission.ManageAudits)
  .input(z.object({
    name: z.string().min(1),
    frameworkVersionId: z.number().int(),
    leadAuditorId: z.uuid(),
    auditType: z.enum(["internal", "external", "other"]),
    startDate: z.coerce.date(),
    dueDate: z.coerce.date(),
  }))
  .mutation(async ({ ctx, input }) => {
    const audit = new Audit();
    audit.organization = ctx.membership.organization;
    audit.name = input.name;
    audit.frameworkVersion = await ctx.em.getReference(
      FrameworkVersion,
      input.frameworkVersionId,
    );
    audit.leadAuditor = await ctx.em.getReference(User, input.leadAuditorId);
    audit.auditType = input.auditType;
    audit.startDate = input.startDate;
    audit.dueDate = input.dueDate;
    audit.status = AuditStatus.Draft;

    await ctx.em.persistAndFlush(audit);
    return { id: audit.id, name: audit.name };
  }),

listSoA: permissionProcedure(Permission.ReadOrganization)
  .query(async ({ ctx }) => {
    return ctx.em.find(
      SoAEntry,
      { organization: ctx.membership.organization.id },
      { fields: ["id", "isApplicable", "justification", "implementationStatus"] },
    );
  }),

updateSoA: permissionProcedure(Permission.WriteSoA)
  .input(z.object({
    id: z.uuid(),
    isApplicable: z.boolean(),
    justification: z.string(),
    implementationStatus: z.enum([
      "not_implemented",
      "planned",
      "partially_implemented",
      "implemented",
    ]),
  }))
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

listAssessments: permissionProcedure(Permission.ReadOrganization)
  .query(async ({ ctx }) => {
    return ctx.em.find(
      Assessment,
      { audit: { organization: ctx.membership.organization.id } },
      { fields: ["id", "status", "notes", "audit", "requirement"] },
    );
  }),

updateAssessment: permissionProcedure(Permission.WriteAssessments)
  .input(z.object({
    id: z.uuid(),
    status: z.enum([
      "not_assessted",
      "compliant",
      "partially_compliant",
      "non_compliant",
      "not_applicable",
    ]),
    notes: z.string().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    const assessment = await ctx.em.findOne(
      Assessment,
      { id: input.id, audit: { organization: ctx.membership.organization.id } },
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
  .query(async ({ ctx }) => {
    return ctx.em.find(Finding, {
      assessment: { audit: { organization: ctx.membership.organization.id } },
    });
  }),

createFinding: permissionProcedure(Permission.WriteFindings)
  .input(z.object({
    assessmentId: z.uuid(),
    title: z.string().min(1),
    description: z.string().optional(),
    severity: z.enum(["low", "medium", "high", "critical"]),
  }))
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
    finding.identifiedAt = new Date();
    finding.assignedTo = ctx.user;
    await ctx.em.persistAndFlush(finding);

    return { id: finding.id };
  }),

listEvidence: permissionProcedure(Permission.ReadOrganization)
  .query(async ({ ctx }) => {
    return ctx.em.find(Evidence, {
      assessment: { audit: { organization: ctx.membership.organization.id } },
    });
  }),

createEvidence: permissionProcedure(Permission.WriteEvidence)
  .input(z.object({
    assessmentId: z.uuid(),
    title: z.string().min(1),
    description: z.string().optional(),
    mimeType: z.string().min(1).max(150),
    fileSize: z.number().int().positive(),
    capturedAt: z.coerce.date(),
    expiresAt: z.coerce.date(),
  }))
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
    await ctx.em.persistAndFlush(evidence);

    return { id: evidence.id };
  }),
