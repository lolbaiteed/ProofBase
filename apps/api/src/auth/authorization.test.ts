import assert from "node:assert/strict";
import test from "node:test";
import { Permission, roleHasPermission } from "./authorization.js";
import { MembershipRole } from "../entities/Membership.js";

test("owner has every permission", () => {
  for (const permission of Object.values(Permission)) {
    assert.equal(roleHasPermission(MembershipRole.Owner, permission), true);
  }
});

test("admin can manage but cannot transfer ownership", () => {
  assert.equal(
    roleHasPermission(MembershipRole.Admin, Permission.ManageMemberships),
    true,
  );
  assert.equal(
    roleHasPermission(MembershipRole.Admin, Permission.TransferOrganization),
    false,
  );
});

test("auditor and contributor have distinct permissions", () => {
  assert.equal(
    roleHasPermission(MembershipRole.Auditor, Permission.ManageAudits),
    true,
  );
  assert.equal(
    roleHasPermission(MembershipRole.Auditor, Permission.WriteSoA),
    false,
  );

  assert.equal(
    roleHasPermission(MembershipRole.Contributor, Permission.WriteSoA),
    true,
  );
  assert.equal(
    roleHasPermission(MembershipRole.Contributor, Permission.ManageAudits),
    false,
  );
});

test("viewer can read but can't write", () => {
  assert.equal(
    roleHasPermission(MembershipRole.Viewer, Permission.ReadOrganization),
    true,
  );
  assert.equal(
    roleHasPermission(MembershipRole.Viewer, Permission.WriteFindings),
    false,
  );
});
