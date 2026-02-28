const { Address, beginCell } = require("@ton/core");

async function rpc(url, key, method, params) {
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(key ? { "X-API-Key": key } : {}),
    },
    body: JSON.stringify({ id: 1, jsonrpc: "2.0", method, params }),
  });

  const j = await r.json();
  if (!r.ok || j.error) throw new Error(JSON.stringify(j.error || j));
  return j.result;
}

function b64(c) {
  return c.toBoc({ idx: false }).toString("base64");
}

(async () => {
  const presaleRaw = (process.env.PRESALE || "").trim();
  if (!presaleRaw) throw new Error("Missing env PRESALE");

  const targetRaw = (
    process.env.ADDR ||
    process.env.TARGET ||
    process.env.CHECK_TARGET ||
    process.env.OWNER ||
    ""
  ).trim();

  if (!targetRaw) throw new Error("Missing env ADDR (or TARGET/CHECK_TARGET/OWNER)");

  const presale = Address.parse(presaleRaw);
  const target = Address.parse(targetRaw);

  const url =
    (process.env.TONCENTER_JSONRPC || "").trim() ||
    "https://testnet.toncenter.com/api/v2/jsonRPC";

  const key = (process.env.TONCENTER_API_KEY || "").trim();

  const slice = b64(beginCell().storeAddress(target).endCell());

  async function get(method) {
    const res = await rpc(url, key, "runGetMethod", {
      address: presale.toRawString(),
      method,
      stack: [["tvm.Slice", slice]],
    });

    const v = res?.stack?.[0]?.[1];
    console.log(method, "=>", v);
    return v;
  }

  console.log("PRESALE:", presale.toString());
  console.log("TARGET:", target.toString());
  console.log("RPC:", url);

  await get("isPendingGetter");
  await get("pendingUntilGetter");
  await get("pendingQidGetter");
})().catch((e) => {
  console.error("ERR:", e?.message || String(e));
  process.exit(1);
});
