import { Migration } from '@mikro-orm/migrations';

export class Migration20261103062637 extends Migration {

  override name = 'Migration20261103062637';

  override up(): void | Promise<void> {
    this.addSql(`create table "framework" ("id" serial primary key, "code" varchar(255) not null, "name" varchar(255) not null, "description" varchar(255) null);`);

    this.addSql(`create table "framework_version" ("id" serial primary key, "version" varchar(255) not null, "framework_id" int not null, "published_at" date not null);`);

    this.addSql(`create table "organization" ("id" uuid not null, "created_at" date not null, "updated_at" date not null, "name" varchar(200) not null, "code" varchar(50) not null, "is_active" boolean not null default true, primary key ("id"));`);
    this.addSql(`alter table "organization" add constraint "organization_code_unique" unique ("code");`);

    this.addSql(`create table "person" ("id" uuid not null, "created_at" date not null, "updated_at" date not null, "first_name" varchar(255) not null, "last_name" varchar(255) not null, primary key ("id"));`);

    this.addSql(`create table "requirement" ("id" uuid not null, "created_at" date not null, "updated_at" date not null, "framework_version_id" int not null, "code" varchar(255) not null, "title" varchar(255) not null, "description" varchar(255) null, "type" text not null, "parent_id" uuid null, primary key ("id"));`);

    this.addSql(`create table "app_user" ("id" uuid not null, "created_at" date not null, "updated_at" date not null, "email" varchar(255) not null, "password_hash" varchar(255) not null, "person_id" uuid not null, "organization_id" uuid not null, primary key ("id"));`);
    this.addSql(`alter table "app_user" add constraint "app_user_email_unique" unique ("email");`);
    this.addSql(`alter table "app_user" add constraint "app_user_person_id_unique" unique ("person_id");`);

    this.addSql(`create table "so_aentry" ("id" uuid not null, "created_at" date not null, "updated_at" date not null, "requirement_id" uuid not null, "is_applicable" boolean not null, "justification" text not null, "implementation_status" text not null, "control_owner_id" uuid null, "reviewed_at" date null, "organization_id" uuid not null, primary key ("id"));`);

    this.addSql(`create table "membership" ("id" uuid not null, "created_at" date not null, "updated_at" date not null, "organization_id" uuid not null, "user_id" uuid not null, "role" text not null, "status" text not null, "joined_at" date null, primary key ("id"));`);

    this.addSql(`create table "enrollment_token" ("id" uuid not null, "created_at" date not null, "updated_at" date not null, "user_id" uuid not null, "token_hash" varchar(255) not null, "expires_at" timestamptz not null, "used_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "enrollment_token" add constraint "enrollment_token_token_hash_unique" unique ("token_hash");`);

    this.addSql(`create table "auth_session" ("id" uuid not null, "user_id" uuid null, "token_hash" varchar(255) null, "expires_at" timestamptz null, "revoked_at" timestamptz null, primary key ("id"));`);
    this.addSql(`alter table "auth_session" add constraint "auth_session_token_hash_unique" unique ("token_hash");`);

    this.addSql(`create table "authenticator_credential" ("id" uuid not null, "created_at" date not null, "updated_at" date not null, "user_id" uuid not null, "credential_id" varchar(255) not null, "public_key" text not null, "counter" int not null default 0, "transports" jsonb null, primary key ("id"));`);
    this.addSql(`alter table "authenticator_credential" add constraint "authenticator_credential_credential_id_unique" unique ("credential_id");`);

    this.addSql(`create table "auth_challenge" ("id" uuid not null, "created_at" date not null, "updated_at" date not null, "user_id" uuid not null, "enrollment_token_id" uuid null, "type" text not null, "challenge" varchar(255) not null, "pending_password_hash" text null, "expires_at" timestamptz not null, "consumed_at" timestamptz null, primary key ("id"));`);

    this.addSql(`create table "audit" ("id" uuid not null, "created_at" date not null, "updated_at" date not null, "organization_id" uuid not null, "framework_version_id" int not null, "name" varchar(255) not null, "status" text not null, "notes" varchar(255) null, "audit_type" text not null, "start_date" date not null, "due_date" date not null, "lead_auditor_id" uuid not null, primary key ("id"));`);

    this.addSql(`create table "audit_scope" ("id" uuid not null, "created_at" date not null, "updated_at" date not null, "audit_id" uuid not null, "boundary" varchar(255) not null, "included_units" text[] not null, "exclusions" jsonb not null, "exclusion_justification" varchar(255) null, primary key ("id"));`);

    this.addSql(`create table "assessment" ("id" uuid not null, "created_at" date not null, "updated_at" date not null, "status" text not null, "notes" text null, "accessor_id" uuid null, "reviewer_id" uuid null, "reviewed_at" date null, "audit_id" uuid not null, "requirement_id" uuid not null, primary key ("id"));`);

    this.addSql(`create table "finding" ("id" uuid not null, "created_at" date not null, "updated_at" date not null, "severity" text not null, "status" text not null, "identified_at" date not null, "closed_at" date null, "assigned_to_id" uuid null, "assessment_id" uuid not null, "title" varchar(255) not null, "description" text null, primary key ("id"));`);

    this.addSql(`create table "corrective_action" ("id" uuid not null, "created_at" date not null, "updated_at" date not null, "finding_id" uuid not null, "description" text not null, "owner_id" uuid not null, "due_date" date null, "status" text not null, "completed_at" date null, "resolution_notes" text null, primary key ("id"));`);

    this.addSql(`create table "evidence" ("id" uuid not null, "created_at" date not null, "updated_at" date not null, "assessment_id" uuid not null, "uploaded_by_id" uuid not null, "title" varchar(255) not null, "description" text null, "storage_key" varchar(255) null, "mime_type" varchar(150) not null, "file_size" numeric(10,0) not null, "captured_at" date not null, "expires_at" date not null, primary key ("id"));`);

    this.addSql(`create table "activity" ("id" uuid not null, "created_at" date not null, "updated_at" date not null, "organization_id" uuid not null, "audit_id" uuid null, "actor_id" uuid null, "action" text not null, "entity_type" varchar(255) not null, "entity_id" uuid not null, "metadata" jsonb null, primary key ("id"));`);

    this.addSql(`alter table "framework_version" add constraint "framework_version_framework_id_foreign" foreign key ("framework_id") references "framework" ("id");`);

    this.addSql(`alter table "requirement" add constraint "requirement_framework_version_id_foreign" foreign key ("framework_version_id") references "framework_version" ("id");`);
    this.addSql(`alter table "requirement" add constraint "requirement_parent_id_foreign" foreign key ("parent_id") references "requirement" ("id") on delete set null;`);
    this.addSql(`alter table "requirement" add constraint "requirement_type_check" check ("type" in ('clause', 'control'));`);

    this.addSql(`alter table "app_user" add constraint "app_user_person_id_foreign" foreign key ("person_id") references "person" ("id");`);
    this.addSql(`alter table "app_user" add constraint "app_user_organization_id_foreign" foreign key ("organization_id") references "organization" ("id");`);

    this.addSql(`alter table "so_aentry" add constraint "so_aentry_requirement_id_foreign" foreign key ("requirement_id") references "requirement" ("id");`);
    this.addSql(`alter table "so_aentry" add constraint "so_aentry_control_owner_id_foreign" foreign key ("control_owner_id") references "app_user" ("id") on delete set null;`);
    this.addSql(`alter table "so_aentry" add constraint "so_aentry_organization_id_foreign" foreign key ("organization_id") references "organization" ("id");`);
    this.addSql(`alter table "so_aentry" add constraint "so_aentry_implementation_status_check" check ("implementation_status" in ('not_implemented', 'planned', 'partially_implemented', 'implemented'));`);

    this.addSql(`alter table "membership" add constraint "membership_organization_id_foreign" foreign key ("organization_id") references "organization" ("id");`);
    this.addSql(`alter table "membership" add constraint "membership_user_id_foreign" foreign key ("user_id") references "app_user" ("id");`);
    this.addSql(`alter table "membership" add constraint "membership_role_check" check ("role" in ('owner', 'admin', 'auditor', 'contributor', 'viewer'));`);
    this.addSql(`alter table "membership" add constraint "membership_status_check" check ("status" in ('active', 'invited'));`);

    this.addSql(`alter table "enrollment_token" add constraint "enrollment_token_user_id_foreign" foreign key ("user_id") references "app_user" ("id");`);

    this.addSql(`alter table "auth_session" add constraint "auth_session_user_id_foreign" foreign key ("user_id") references "app_user" ("id") on delete set null;`);

    this.addSql(`alter table "authenticator_credential" add constraint "authenticator_credential_user_id_foreign" foreign key ("user_id") references "app_user" ("id");`);

    this.addSql(`alter table "auth_challenge" add constraint "auth_challenge_user_id_foreign" foreign key ("user_id") references "app_user" ("id");`);
    this.addSql(`alter table "auth_challenge" add constraint "auth_challenge_enrollment_token_id_foreign" foreign key ("enrollment_token_id") references "enrollment_token" ("id") on delete set null;`);
    this.addSql(`alter table "auth_challenge" add constraint "auth_challenge_type_check" check ("type" in ('login', 'enrollment'));`);

    this.addSql(`alter table "audit" add constraint "audit_organization_id_foreign" foreign key ("organization_id") references "organization" ("id");`);
    this.addSql(`alter table "audit" add constraint "audit_framework_version_id_foreign" foreign key ("framework_version_id") references "framework_version" ("id");`);
    this.addSql(`alter table "audit" add constraint "audit_lead_auditor_id_foreign" foreign key ("lead_auditor_id") references "app_user" ("id");`);
    this.addSql(`alter table "audit" add constraint "audit_status_check" check ("status" in ('draft', 'in_progress', 'under_review', 'completed'));`);
    this.addSql(`alter table "audit" add constraint "audit_audit_type_check" check ("audit_type" in ('internal', 'external', 'other'));`);

    this.addSql(`alter table "audit_scope" add constraint "audit_scope_audit_id_foreign" foreign key ("audit_id") references "audit" ("id");`);

    this.addSql(`alter table "assessment" add constraint "assessment_accessor_id_foreign" foreign key ("accessor_id") references "app_user" ("id") on delete set null;`);
    this.addSql(`alter table "assessment" add constraint "assessment_reviewer_id_foreign" foreign key ("reviewer_id") references "app_user" ("id") on delete set null;`);
    this.addSql(`alter table "assessment" add constraint "assessment_audit_id_foreign" foreign key ("audit_id") references "audit" ("id");`);
    this.addSql(`alter table "assessment" add constraint "assessment_requirement_id_foreign" foreign key ("requirement_id") references "requirement" ("id");`);
    this.addSql(`alter table "assessment" add constraint "assessment_status_check" check ("status" in ('not_assessted', 'compliant', 'partially_compliant', 'non_compliant', 'not_applicable'));`);

    this.addSql(`alter table "finding" add constraint "finding_assigned_to_id_foreign" foreign key ("assigned_to_id") references "app_user" ("id") on delete set null;`);
    this.addSql(`alter table "finding" add constraint "finding_assessment_id_foreign" foreign key ("assessment_id") references "assessment" ("id");`);
    this.addSql(`alter table "finding" add constraint "finding_severity_check" check ("severity" in ('low', 'medium', 'high', 'critical'));`);
    this.addSql(`alter table "finding" add constraint "finding_status_check" check ("status" in ('open', 'in_progress', 'resolved', 'accepted'));`);

    this.addSql(`alter table "corrective_action" add constraint "corrective_action_finding_id_foreign" foreign key ("finding_id") references "finding" ("id");`);
    this.addSql(`alter table "corrective_action" add constraint "corrective_action_owner_id_foreign" foreign key ("owner_id") references "app_user" ("id");`);
    this.addSql(`alter table "corrective_action" add constraint "corrective_action_status_check" check ("status" in ('open', 'in_progress', 'completed', 'cancelled'));`);

    this.addSql(`alter table "evidence" add constraint "evidence_assessment_id_foreign" foreign key ("assessment_id") references "assessment" ("id");`);
    this.addSql(`alter table "evidence" add constraint "evidence_uploaded_by_id_foreign" foreign key ("uploaded_by_id") references "app_user" ("id");`);

    this.addSql(`alter table "activity" add constraint "activity_organization_id_foreign" foreign key ("organization_id") references "organization" ("id");`);
    this.addSql(`alter table "activity" add constraint "activity_audit_id_foreign" foreign key ("audit_id") references "audit" ("id") on delete set null;`);
    this.addSql(`alter table "activity" add constraint "activity_actor_id_foreign" foreign key ("actor_id") references "app_user" ("id") on delete set null;`);
    this.addSql(`alter table "activity" add constraint "activity_action_check" check ("action" in ('evidence_uploaded', 'assessment_updated', 'finding_created'));`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "framework_version" drop constraint "framework_version_framework_id_foreign";`);
    this.addSql(`alter table "requirement" drop constraint "requirement_framework_version_id_foreign";`);
    this.addSql(`alter table "audit" drop constraint "audit_framework_version_id_foreign";`);
    this.addSql(`alter table "app_user" drop constraint "app_user_organization_id_foreign";`);
    this.addSql(`alter table "so_aentry" drop constraint "so_aentry_organization_id_foreign";`);
    this.addSql(`alter table "membership" drop constraint "membership_organization_id_foreign";`);
    this.addSql(`alter table "audit" drop constraint "audit_organization_id_foreign";`);
    this.addSql(`alter table "activity" drop constraint "activity_organization_id_foreign";`);
    this.addSql(`alter table "app_user" drop constraint "app_user_person_id_foreign";`);
    this.addSql(`alter table "requirement" drop constraint "requirement_parent_id_foreign";`);
    this.addSql(`alter table "so_aentry" drop constraint "so_aentry_requirement_id_foreign";`);
    this.addSql(`alter table "assessment" drop constraint "assessment_requirement_id_foreign";`);
    this.addSql(`alter table "so_aentry" drop constraint "so_aentry_control_owner_id_foreign";`);
    this.addSql(`alter table "membership" drop constraint "membership_user_id_foreign";`);
    this.addSql(`alter table "enrollment_token" drop constraint "enrollment_token_user_id_foreign";`);
    this.addSql(`alter table "auth_session" drop constraint "auth_session_user_id_foreign";`);
    this.addSql(`alter table "authenticator_credential" drop constraint "authenticator_credential_user_id_foreign";`);
    this.addSql(`alter table "auth_challenge" drop constraint "auth_challenge_user_id_foreign";`);
    this.addSql(`alter table "audit" drop constraint "audit_lead_auditor_id_foreign";`);
    this.addSql(`alter table "assessment" drop constraint "assessment_accessor_id_foreign";`);
    this.addSql(`alter table "assessment" drop constraint "assessment_reviewer_id_foreign";`);
    this.addSql(`alter table "finding" drop constraint "finding_assigned_to_id_foreign";`);
    this.addSql(`alter table "corrective_action" drop constraint "corrective_action_owner_id_foreign";`);
    this.addSql(`alter table "evidence" drop constraint "evidence_uploaded_by_id_foreign";`);
    this.addSql(`alter table "activity" drop constraint "activity_actor_id_foreign";`);
    this.addSql(`alter table "auth_challenge" drop constraint "auth_challenge_enrollment_token_id_foreign";`);
    this.addSql(`alter table "audit_scope" drop constraint "audit_scope_audit_id_foreign";`);
    this.addSql(`alter table "assessment" drop constraint "assessment_audit_id_foreign";`);
    this.addSql(`alter table "activity" drop constraint "activity_audit_id_foreign";`);
    this.addSql(`alter table "finding" drop constraint "finding_assessment_id_foreign";`);
    this.addSql(`alter table "evidence" drop constraint "evidence_assessment_id_foreign";`);
    this.addSql(`alter table "corrective_action" drop constraint "corrective_action_finding_id_foreign";`);

    this.addSql(`drop table if exists "framework" cascade;`);
    this.addSql(`drop table if exists "framework_version" cascade;`);
    this.addSql(`drop table if exists "organization" cascade;`);
    this.addSql(`drop table if exists "person" cascade;`);
    this.addSql(`drop table if exists "requirement" cascade;`);
    this.addSql(`drop table if exists "app_user" cascade;`);
    this.addSql(`drop table if exists "so_aentry" cascade;`);
    this.addSql(`drop table if exists "membership" cascade;`);
    this.addSql(`drop table if exists "enrollment_token" cascade;`);
    this.addSql(`drop table if exists "auth_session" cascade;`);
    this.addSql(`drop table if exists "authenticator_credential" cascade;`);
    this.addSql(`drop table if exists "auth_challenge" cascade;`);
    this.addSql(`drop table if exists "audit" cascade;`);
    this.addSql(`drop table if exists "audit_scope" cascade;`);
    this.addSql(`drop table if exists "assessment" cascade;`);
    this.addSql(`drop table if exists "finding" cascade;`);
    this.addSql(`drop table if exists "corrective_action" cascade;`);
    this.addSql(`drop table if exists "evidence" cascade;`);
    this.addSql(`drop table if exists "activity" cascade;`);
  }

}
