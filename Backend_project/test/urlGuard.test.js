import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeUrl,
  normalizeDomain,
  isBlockedIp,
  assertSafeUrl,
  RejectionReason,
} from "../services/urlGuard.js";

// Plan section 5.3 listed ten payloads that the original bare `new URL()` check
// mishandled. Those exact payloads are the fixture here.

test("rejects non-http(s) schemes", () => {
  for (const input of [
    "javascript:alert(1)",
    "file:///etc/passwd",
    "ftp://x.com",
    "mailto:a@b.c",
    "data:text/html,<script>alert(1)</script>",
    "gopher://x.com",
  ]) {
    const result = normalizeUrl(input);
    assert.equal(result.ok, false, `${input} should be rejected`);
    assert.equal(result.reason, RejectionReason.BAD_SCHEME, `${input} wrong reason`);
  }
});

test("rejects loopback, private and link-local literals", () => {
  for (const input of [
    "http://localhost:8080/admin",
    "http://127.0.0.1",
    "http://169.254.169.254/latest/meta-data/", // cloud instance metadata
    "http://[::1]/",
    "http://10.0.0.5",
    "http://192.168.1.1",
    "http://172.16.0.1",
    "http://0.0.0.0",
  ]) {
    const result = normalizeUrl(input);
    assert.equal(result.ok, false, `${input} should be rejected`);
    assert.equal(result.reason, RejectionReason.PRIVATE_IP, `${input} wrong reason`);
  }
});

test("accepts a bare hostname and normalises it to https", () => {
  // The usability half of the bug: "example.com" is how most people type it.
  const result = normalizeUrl("example.com");
  assert.equal(result.ok, true);
  assert.equal(result.url.protocol, "https:");
  assert.equal(result.url.hostname, "example.com");
});

test("does not prepend a scheme to something that already has one", () => {
  // Guards the regression where blind prefixing turns javascript: into
  // https://javascript:alert(1) and smuggles it past the allowlist.
  const result = normalizeUrl("javascript:alert(1)");
  assert.equal(result.ok, false);
  assert.equal(result.reason, RejectionReason.BAD_SCHEME);
});

test("accepts ordinary public http and https addresses", () => {
  for (const input of ["https://example.com", "http://example.com/path?q=1"]) {
    assert.equal(normalizeUrl(input).ok, true, `${input} should be accepted`);
  }
});

test("rejects embedded credentials", () => {
  const result = normalizeUrl("https://user:pass@example.com");
  assert.equal(result.ok, false);
  assert.equal(result.reason, RejectionReason.HAS_CREDENTIALS);
});

test("rejects non-web ports", () => {
  const result = normalizeUrl("http://example.com:22");
  assert.equal(result.ok, false);
  assert.equal(result.reason, RejectionReason.BAD_PORT);
});

test("rejects empty and malformed input", () => {
  assert.equal(normalizeUrl("").reason, RejectionReason.EMPTY);
  assert.equal(normalizeUrl("   ").reason, RejectionReason.EMPTY);
  assert.equal(normalizeUrl("not a url").reason, RejectionReason.MALFORMED);
});

test("isBlockedIp covers reserved ranges in both families", () => {
  const blocked = [
    "127.0.0.1",
    "10.1.2.3",
    "172.31.255.255",
    "192.168.0.1",
    "169.254.169.254",
    "100.64.0.1",
    "224.0.0.1",
    "255.255.255.255",
    "::1",
    "fe80::1",
    "fc00::1",
    "::ffff:127.0.0.1", // IPv4-mapped loopback
  ];
  for (const ip of blocked) {
    assert.equal(isBlockedIp(ip), true, `${ip} should be blocked`);
  }

  const allowed = ["8.8.8.8", "1.1.1.1", "172.32.0.1", "2001:4860:4860::8888"];
  for (const ip of allowed) {
    assert.equal(isBlockedIp(ip), false, `${ip} should be allowed`);
  }
});

test("normalizeDomain strips www and lowercases", () => {
  assert.equal(normalizeDomain("WWW.Example.COM"), "example.com");
  assert.equal(normalizeDomain("example.com."), "example.com");
  assert.equal(normalizeDomain("sub.example.com"), "sub.example.com");
});

test("assertSafeUrl refuses a hostname that resolves to loopback", async () => {
  // localhost.localdomain style names are the classic DNS-based bypass; the
  // literal check cannot catch them, only resolve-then-validate can.
  const result = await assertSafeUrl("http://localhost");
  assert.equal(result.ok, false);
});
