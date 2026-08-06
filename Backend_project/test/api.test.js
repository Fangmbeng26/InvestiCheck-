import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import app from "../app.js";

// Integration tests over the real Express app. These deliberately avoid any
// route that writes to MongoDB, so the suite runs without a database — the
// database-backed paths are exercised manually via the Swagger UI.

let server;
let baseUrl;

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

const get = (path) => fetch(`${baseUrl}${path}`);
const post = (path, body) =>
  fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

test("GET /api/health reports service status", async () => {
  const response = await get("/api/health");
  assert.equal(response.status, 200);

  const body = await response.json();
  assert.equal(body.status, "ok");
  assert.ok("database" in body);
});

test("GET /api/docs.json serves a valid OpenAPI document", async () => {
  const response = await get("/api/docs.json");
  assert.equal(response.status, 200);

  const spec = await response.json();
  assert.equal(spec.openapi, "3.0.3");
  assert.equal(spec.info.title, "InvestiCheck API");

  // Every route the plan specifies must be documented.
  for (const path of [
    "/api/analysis",
    "/api/analysis/{id}",
    "/api/analysis/osint",
    "/api/analysis/indicators",
    "/api/reports",
    "/api/auth/signup",
    "/api/auth/login",
    "/api/admin/stats",
    "/api/admin/reports",
    "/api/admin/watchlist",
  ]) {
    assert.ok(spec.paths[path], `${path} should be documented`);
  }
});

test("GET /api/docs serves the Swagger UI", async () => {
  const response = await get("/api/docs/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /text\/html/);
});

test("GET /api/analysis/indicators publishes questions and bands", async () => {
  const response = await get("/api/analysis/indicators");
  assert.equal(response.status, 200);

  const body = await response.json();

  // All seven behavioural questions (FR-08 … FR-11).
  assert.equal(body.questions.length, 7);
  assert.equal(body.technicalIndicators.length, 5);

  const ids = body.questions.map((q) => q.id);
  for (const expected of [
    "guaranteedReturns",
    "unusuallyHighReturns",
    "withdrawalProblems",
    "referralRewards",
    "multiLevelReferral",
    "taskBasedEarning",
    "depositBeforeEarning",
  ]) {
    assert.ok(ids.includes(expected), `${expected} should be published`);
  }

  // Every question must offer the three-state answer set.
  for (const question of body.questions) {
    assert.deepEqual(question.answers, ["yes", "no", "unknown"]);
    assert.ok(question.help, `${question.id} needs plain-language help text (NFR 11.1)`);
  }

  // FR-13 bands, unchanged from the SRS.
  assert.deepEqual(
    body.bands.map((b) => b.max),
    [30, 60, 100]
  );
});

test("GET /api/reports/complaint-types lists the FR-11 categories", async () => {
  const response = await get("/api/reports/complaint-types");
  assert.equal(response.status, 200);

  const body = await response.json();
  const values = body.complaintTypes.map((t) => t.value);
  assert.ok(values.includes("unable_to_withdraw"));
  assert.ok(values.includes("extra_payment_demanded"));
  // Every category needs a human-readable label for the dropdown.
  assert.ok(body.complaintTypes.every((t) => t.label && t.label !== t.value));
});

test("admin routes reject anonymous callers with 401", async () => {
  for (const path of ["/api/admin/stats", "/api/admin/reports", "/api/admin/watchlist"]) {
    const response = await get(path);
    assert.equal(response.status, 401, `${path} should require authentication`);
  }
});

test("admin routes reject a malformed token with 401", async () => {
  const response = await fetch(`${baseUrl}/api/admin/stats`, {
    headers: { Authorization: "Bearer not-a-real-token" },
  });
  assert.equal(response.status, 401);
});

test("POST /api/analysis rejects missing fields with structured errors", async () => {
  const response = await post("/api/analysis", { platformName: "" });
  assert.equal(response.status, 400);

  const body = await response.json();
  assert.equal(body.error, "Validation failed");
  assert.ok(Array.isArray(body.details));
  assert.ok(body.details.some((d) => d.field === "website"));
});

test("POST /api/analysis refuses SSRF payloads before touching the network", async () => {
  for (const website of [
    "javascript:alert(1)",
    "file:///etc/passwd",
    "http://127.0.0.1/admin",
    "http://169.254.169.254/latest/meta-data/",
    "http://[::1]/",
  ]) {
    const response = await post("/api/analysis", { platformName: "Test", website });
    assert.equal(response.status, 400, `${website} must be rejected`);
  }
});

test("POST /api/analysis/osint refuses SSRF payloads too", async () => {
  const response = await post("/api/analysis/osint", {
    website: "http://169.254.169.254/latest/meta-data/",
  });
  assert.equal(response.status, 400);
});

test("POST /api/reports validates the complaint category and description length", async () => {
  const badType = await post("/api/reports", {
    platformName: "Test Platform",
    complaintType: "not_a_real_category",
    description: "This description is long enough to pass.",
  });
  assert.equal(badType.status, 400);

  const shortDescription = await post("/api/reports", {
    platformName: "Test Platform",
    complaintType: "unable_to_withdraw",
    description: "too short",
  });
  assert.equal(shortDescription.status, 400);
});

test("POST /api/auth/signup rejects a weak password and a bad email", async () => {
  const weak = await post("/api/auth/signup", {
    firstName: "A",
    lastName: "B",
    email: "a@b.com",
    password: "short",
  });
  assert.equal(weak.status, 400);

  const badEmail = await post("/api/auth/signup", {
    firstName: "A",
    lastName: "B",
    email: "not-an-email",
    password: "long-enough-password",
  });
  assert.equal(badEmail.status, 400);
});

test("unknown routes return a 404 in the standard error shape", async () => {
  const response = await get("/api/does-not-exist");
  assert.equal(response.status, 404);

  const body = await response.json();
  assert.equal(body.error, "Not found");
});

test("security headers are applied", async () => {
  const response = await get("/api/health");
  // helmet sets these; their absence means the middleware was dropped.
  assert.ok(response.headers.get("x-content-type-options"));
  assert.equal(response.headers.get("x-powered-by"), null, "Express banner should be hidden");
});
