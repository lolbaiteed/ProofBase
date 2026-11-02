import assert from "node:assert/strict";
import { test } from "node:test";
import { hashPassword, verifyPassword } from "./password.js";

test("password hashes verify only the original password", async () => {
  const password = "correct horse battery staple 2026";
  const encoded = await hashPassword(password);

  assert.match(encoded, /^scrypt\$/);
  assert.notEqual(encoded, await hashPassword(password));
  assert.equal(await verifyPassword(password, encoded), true);
  assert.equal(await verifyPassword("incorrect password", encoded), false);
  assert.equal(await verifyPassword(password, "!setup-required!"), false);
});
