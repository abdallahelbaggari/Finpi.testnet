/* ================================================================
   FinPi · functions/complete.js · Cloudflare Pages Function
   Route: /complete (POST)
   Pi Network Testnet · sandbox:true
   ALWAYS return HTTP 200 — non-200 = Payment Expired on Pi side
================================================================ */

export async function onRequestGet(context) {
  const key = context.env.PI_API_KEY;
  return new Response(JSON.stringify({
    success: true,
    message: "FinPi /complete endpoint is live",
    app: "finpi-testnet.pages.dev",
    route: "/complete",
    network: "Pi Testnet · sandbox:true",
    pi_api_key_present: !!key,
    pi_api_key_length: key ? key.length : 0,
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

export async function onRequestPost(context) {
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  console.log("[FinPi] /complete POST received");

  try {
    const body = await context.request.json();
    const paymentId = body.paymentId;
    const txid      = body.txid;

    console.log("[FinPi] /complete paymentId:", paymentId, "txid:", txid);

    if (!paymentId) {
      return new Response(
        JSON.stringify({ completed: false, error: "missing paymentId" }),
        { status: 200, headers: CORS }
      );
    }

    if (!txid) {
      console.log("[FinPi] /complete — no txid yet, returning completed:true to avoid expiry");
      return new Response(
        JSON.stringify({ completed: true, note: "waiting_for_txid" }),
        { status: 200, headers: CORS }
      );
    }

    const PI_API_KEY = context.env.PI_API_KEY;
    if (!PI_API_KEY) {
      console.error("[FinPi] PI_API_KEY not configured");
      return new Response(
        JSON.stringify({ completed: true, note: "no_api_key — set PI_API_KEY in Cloudflare Pages env" }),
        { status: 200, headers: CORS }
      );
    }

    /* Call Pi API — complete */
    console.log("[FinPi] Calling Pi API complete for:", paymentId, "txid:", txid);
    const piRes = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}/complete`,
      {
        method: "POST",
        headers: {
          "Authorization": `Key ${PI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ txid })
      }
    );

    const piRaw = await piRes.text();
    console.log("[FinPi] Pi complete response:", piRes.status, piRaw.substring(0, 300));

    return new Response(
      JSON.stringify({
        completed: piRes.ok,
        pi_status: piRes.status,
        pi_ok: piRes.ok,
        paymentId,
        txid
      }),
      { status: 200, headers: CORS }
    );

  } catch (err) {
    console.error("[FinPi] /complete error:", err.message);
    return new Response(
      JSON.stringify({ completed: false, error: err.message }),
      { status: 200, headers: CORS }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
