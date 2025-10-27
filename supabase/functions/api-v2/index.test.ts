// deno test --allow-all supabase/functions/api-v2/index.test.ts
import {
  assertEquals,
  assert,
} from "https://deno.land/std@0.202.0/testing/asserts.ts";

const SMARTCODE_REGEX =
  /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/;

Deno.test("Smart Code regex allows canonical examples", () => {
  const ok = [
    "HERA.FINANCE.TXN.SALE.v1",
    "HERA.ACCOUNTING.COA.ACCOUNT.GL.ASSET.v1",
    "HERA.SALON.CC.ADMIN.OVERHEAD.v2",
    "HERA.ENTERPRISE.CUSTOMER.v1",
    "HERA.MASTER_DATA.VENDOR.TEMPLATE.v1",
  ];
  for (const s of ok) assert(SMARTCODE_REGEX.test(s), `Should pass: ${s}`);
});

Deno.test("Smart Code regex rejects bad forms", () => {
  const bad = [
    "HERA.SALE", // too short
    "HERA..FINANCE", // double dots
    "HERA.FINANCE.TXN.SALE", // no version
    "HERA.FINANCE.TXN.SALE.v", // incomplete version
    "hera.finance.txn.sale.v1", // lowercase
    "FINANCE.TXN.SALE.v1", // missing HERA prefix
  ];
  for (const s of bad) assertEquals(SMARTCODE_REGEX.test(s), false, `Should fail: ${s}`);
});

Deno.test("GL lines must balance per currency (simple)", () => {
  const lines = [
    { 
      smart_code: "HERA.FINANCE.GL.LINE.v1", 
      line_data: { side: "DR" }, 
      line_amount: 472.5, 
      transaction_currency_code: "AED" 
    },
    { 
      smart_code: "HERA.FINANCE.GL.LINE.v1", 
      line_data: { side: "CR" }, 
      line_amount: 450.0, 
      transaction_currency_code: "AED" 
    },
    { 
      smart_code: "HERA.FINANCE.GL.LINE.v1", 
      line_data: { side: "CR" }, 
      line_amount: 22.5, 
      transaction_currency_code: "AED" 
    },
  ];
  
  const sum = (side: "DR" | "CR") =>
    lines.filter(l => l.line_data.side === side)
         .reduce((a, b) => a + Number(b.line_amount || 0), 0);
  
  const drTotal = sum("DR");
  const crTotal = sum("CR");
  
  assertEquals(drTotal, 472.5, "DR total should be 472.5");
  assertEquals(crTotal, 472.5, "CR total should be 472.5");
  assertEquals(Math.abs(drTotal - crTotal) <= 0.01, true, "DR and CR should balance");
});

Deno.test("GL lines must balance per currency (multi-currency)", () => {
  const lines = [
    // USD transaction
    { smart_code: "HERA.FINANCE.GL.LINE.v1", line_data: { side: "DR" }, line_amount: 100.0, transaction_currency_code: "USD" },
    { smart_code: "HERA.FINANCE.GL.LINE.v1", line_data: { side: "CR" }, line_amount: 100.0, transaction_currency_code: "USD" },
    // AED transaction
    { smart_code: "HERA.FINANCE.GL.LINE.v1", line_data: { side: "DR" }, line_amount: 367.0, transaction_currency_code: "AED" },
    { smart_code: "HERA.FINANCE.GL.LINE.v1", line_data: { side: "CR" }, line_amount: 367.0, transaction_currency_code: "AED" },
  ];
  
  // Check USD balance
  const usdLines = lines.filter(l => l.transaction_currency_code === "USD");
  const usdDr = usdLines.filter(l => l.line_data.side === "DR").reduce((a, b) => a + b.line_amount, 0);
  const usdCr = usdLines.filter(l => l.line_data.side === "CR").reduce((a, b) => a + b.line_amount, 0);
  assertEquals(usdDr, usdCr, "USD should balance");
  
  // Check AED balance
  const aedLines = lines.filter(l => l.transaction_currency_code === "AED");
  const aedDr = aedLines.filter(l => l.line_data.side === "DR").reduce((a, b) => a + b.line_amount, 0);
  const aedCr = aedLines.filter(l => l.line_data.side === "CR").reduce((a, b) => a + b.line_amount, 0);
  assertEquals(aedDr, aedCr, "AED should balance");
});

Deno.test("Non-GL lines should be ignored in balance check", () => {
  const lines = [
    // GL lines that balance
    { smart_code: "HERA.FINANCE.GL.ASSET.v1", line_data: { side: "DR" }, line_amount: 100.0, transaction_currency_code: "USD" },
    { smart_code: "HERA.FINANCE.GL.REVENUE.v1", line_data: { side: "CR" }, line_amount: 100.0, transaction_currency_code: "USD" },
    // Non-GL line (should be ignored)
    { smart_code: "HERA.INVENTORY.ITEM.MOVEMENT.v1", line_data: { side: "DR" }, line_amount: 50.0, transaction_currency_code: "USD" },
  ];
  
  // Only GL lines should be considered for balance check
  const glLines = lines.filter(l => l.smart_code.includes(".GL."));
  assertEquals(glLines.length, 2, "Should have 2 GL lines");
  
  const glDr = glLines.filter(l => l.line_data.side === "DR").reduce((a, b) => a + b.line_amount, 0);
  const glCr = glLines.filter(l => l.line_data.side === "CR").reduce((a, b) => a + b.line_amount, 0);
  assertEquals(glDr, glCr, "GL lines should balance");
});

Deno.test("Request ID generation works", () => {
  const rid1 = crypto.randomUUID();
  const rid2 = crypto.randomUUID();
  
  assert(rid1.length > 0, "Request ID should not be empty");
  assert(rid2.length > 0, "Request ID should not be empty");
  assert(rid1 !== rid2, "Request IDs should be unique");
  assert(rid1.includes("-"), "Request ID should be UUID format");
});

Deno.test("Authorization header parsing", () => {
  // Mock request with Bearer token
  const mockRequest = new Request("https://example.com", {
    headers: {
      "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    }
  });
  
  const getBearer = (req: Request) => {
    const raw = req.headers.get("Authorization") || "";
    return raw.startsWith("Bearer ") ? raw.slice(7) : "";
  };
  
  const token = getBearer(mockRequest);
  assertEquals(token, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9", "Should extract JWT from Bearer header");
  
  // Test missing Authorization header
  const mockRequestNoAuth = new Request("https://example.com");
  const emptyToken = getBearer(mockRequestNoAuth);
  assertEquals(emptyToken, "", "Should return empty string for missing auth header");
});