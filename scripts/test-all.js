import { spawn, execSync } from 'node:child_process';
import http from 'node:http';

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log("1. Running lint check...");
  execSync("npm run lint", { stdio: "inherit" });

  console.log("\n2. Running build check...");
  execSync("npm run build", { stdio: "inherit" });

  console.log("\n3. Starting server for API tests...");
  const port = 5050;
  const server = spawn("node", ["server.js"], {
    env: { ...process.env, PORT: String(port) },
    stdio: "pipe"
  });

  await new Promise((r) => setTimeout(r, 1200));

  try {
    console.log("\n4. Testing GET /api/health...");
    const health = await request({ hostname: "localhost", port, path: "/api/health", method: "GET" });
    if (health.status !== 200 || !health.body.ok) {
      throw new Error("Health check failed: " + JSON.stringify(health));
    }
    console.log("✅ GET /api/health passed.");

    console.log("\n5. Testing POST /api/create-order (quote mode)...");
    const quote = await request(
      {
        hostname: "localhost",
        port,
        path: "/api/create-order",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      },
      { mode: "quote", serviceId: "deep-1bhk", addons: [] }
    );
    // Base price = 2999, convenience fee = 49, taxable = 3048, 5% GST on 3048 = 152. Total = 3200.
    if (quote.status !== 200 || !quote.body.quote || quote.body.quote.total !== 3200) {
      throw new Error("Create order quote failed: " + JSON.stringify(quote));
    }
    console.log("✅ POST /api/create-order (quote) passed.");

    console.log("\n6. Testing POST /api/create-order (COD disabled rejection)...");
    const cod = await request(
      {
        hostname: "localhost",
        port,
        path: "/api/create-order",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      },
      { paymentMethod: "COD" }
    );
    if (cod.status !== 400 || cod.body.code !== "COD_DISABLED") {
      throw new Error("COD rejection test failed: " + JSON.stringify(cod));
    }
    console.log("✅ COD rejection test passed.");

    console.log("\n7. Testing POST /api/verify-payment (unconfigured gateway rejection)...");
    const verify = await request(
      {
        hostname: "localhost",
        port,
        path: "/api/verify-payment",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      },
      {}
    );
    if (verify.status !== 503 || verify.body.code !== "PAYMENT_GATEWAY_NOT_CONFIGURED") {
      throw new Error("Verify payment test failed: " + JSON.stringify(verify));
    }
    console.log("✅ Verify payment test passed.");

    console.log("\n✨ ALL TESTS PASSED SUCCESSFULLY! ✨");
  } finally {
    server.kill();
  }
}

runTests().catch((err) => {
  console.error("❌ Test suite failed:", err);
  process.exit(1);
});
