import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../app.js';

const server = http.createServer(app);

await new Promise((resolve) => server.listen(0, resolve));
const { port } = server.address();

function closeServer() {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

test('signup route returns a validation error for missing fields', async () => {
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com' })
  });

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.match(body.message, /required/i);
});

test.after(async () => {
  await closeServer();
});
