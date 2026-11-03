export enum ActivityAction {
  EvidenceUploaded = "evidence_uploaded",
  AssessmentUpdated = "assessment_updated",
  FindingCreated = "finding_created",
}

export enum AssessmentStatus {
  NotAssessted = "not_assessted",
  Compliant = "compliant",
  PartiallyCompliant = "partially_compliant",
  NonCompliant = "non_compliant",
  NotApplicable = "not_applicable",
}

export enum AuditStatus {
  Draft = "draft",
  InProgress = "in_progress",
  UnderReview = "under_review",
  Completed = "completed",
}

export enum AuditType {
  Internal = "internal",
  External = "external",
  Other = "other",
}

export enum AuthChallengeType {
  Login = "login",
  Enrollment = "enrollment",
}

export enum CorrectiveActionStatus {
  Open = "open",
  InProgress = "in_progress",
  Completed = "completed",
  Cancelled = "cancelled",
}

export enum FindingSeverity {
  Low = "low",
  Medium = "medium",
  High = "high",
  Critical = "critical",
}

export enum FindingStatus {
  Open = "open",
  InProgress = "in_progress",
  Resolved = "resolved",
  Accepted = "accepted",
}

export enum MembershipRole {
  Owner = "owner",
  Admin = "admin",
  Auditor = "auditor",
  Contributor = "contributor",
  Viewer = "viewer",
}

export enum MembershipStatus {
  Active = "active",
  Invited = "invited",
}

export enum RequirementType {
  Clause = "clause",
  Control = "control",
}

export enum ImplementationStatus {
  NotImplemented = "not_implemented",
  Planned = "planned",
  PartiallyImplemented = "partially_implemented",
  Implemented = "implemented",
}

export enum Permission {
  ReadOrganization = "organization:read",
  ManageOrganization = "organization:manage",
  TransferOrganization = "organization:transfer-ownership",
  ManageMemberships = "membership:manage",
  ManageAudits = "audit:manage",
  WriteSoA = "soa:write",
  WriteAssessments = "assessment:write",
  WriteFindings = "finding:write",
  WriteEvidence = "evidence:write",
}
