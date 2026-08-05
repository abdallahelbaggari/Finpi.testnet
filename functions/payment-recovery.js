/* ================================================================
   FinPi · functions/payment-recovery.js · Cloudflare Pages Function
   Route: /payment-recovery (POST)
   Handles incomplete/pending payments from onIncompletePayment callback
================================================================ */

export async function onRequestGet(context) {
  return new Response(JSON.stringify({
    success: true,
    message: "FinPi /payment-recovery endpoint is live",
    route: "/payment-recovery"
  }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}

export async function onRequestPost(context) {
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  try {
    const body = await context.request.json();
    const { paymentId, txid, action } = body;

    console.log("[FinPi] /payment-recovery:", action, paymentId, txid);

    const PI_API_KEY = context.env.PI_API_KEY;
    if (!PI_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "PI_API_KEY not configured" }),
        { status: 200, headers: CORS }
      );
    }

    if (action === 'approve' || !txid) {
      /* Approve incomplete payment */
      const res = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
        method: "POST",
        headers: { "Authorization": `Key ${PI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const text = await res.text();
      console.log("[FinPi] recovery approve:", res.status, text.substring(0, 200));
      return new Response(
        JSON.stringify({ success: res.ok, pi_status: res.status, action: 'approved' }),
        { status: 200, headers: CORS }
      );
    }

    if (action === 'complete' && txid) {
      /* Complete incomplete payment */
      const res = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
        method: "POST",
        headers: { "Authorization": `Key ${PI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ txid })
      });
      const text = await res.text();
      console.log("[FinPi] recovery complete:", res.status, text.substring(0, 200));
      return new Response(
        JSON.stringify({ success: res.ok, pi_status: res.status, action: 'completed' }),
        { status: 200, headers: CORS }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "unknown action" }),
      { status: 200, headers: CORS }
    );

  } catch (err) {
    console.error("[FinPi] /payment-recovery error:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
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
