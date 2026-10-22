/* ================================================================
   FinPi · functions/approve.js · Cloudflare Pages Function
   Route: /approve (POST)
   Pi Network (mainnet or testnet, set by PI_API_KEY)
   ALWAYS return HTTP 200 — non-200 = Payment Expired on Pi side
================================================================ */

export async function onRequestGet(context) {
  const key = context.env.PI_API_KEY;
  return new Response(JSON.stringify({
    success: true,
    message: "FinPi /approve endpoint is live",
    app: "FinPi",
    route: "/approve",
    network: "set by PI_API_KEY",
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

  console.log("[FinPi] /approve POST received");

  try {
    /* Parse body */
    let paymentId = null;
    try {
      const body = await context.request.json();
      paymentId = body.paymentId || null;
    } catch (e) {
      console.error("[FinPi] /approve body parse error:", e.message);
      return new Response(
        JSON.stringify({ approved: true, note: "body_parse_error", error: e.message }),
        { status: 200, headers: CORS }
      );
    }

    console.log("[FinPi] /approve paymentId:", paymentId);

    if (!paymentId) {
      console.warn("[FinPi] /approve — no paymentId in body");
      return new Response(
        JSON.stringify({ approved: true, note: "no_payment_id" }),
        { status: 200, headers: CORS }
      );
    }

    const PI_API_KEY = context.env.PI_API_KEY;
    if (!PI_API_KEY) {
      console.error("[FinPi] PI_API_KEY not configured");
      return new Response(
        JSON.stringify({ approved: true, note: "no_api_key — set PI_API_KEY in Cloudflare Pages env" }),
        { status: 200, headers: CORS }
      );
    }

    /* Call Pi API — approve */
    console.log("[FinPi] Calling Pi API approve for:", paymentId);
    /* Check the payment with Pi before approving it: a pass must be paid in full,
       and every amount must be a real positive number. A rejected payment simply
       expires and the user is not charged. */
    try {
      const chk = await fetch(`https://api.minepi.com/v2/payments/${paymentId}`, { headers: { 'Authorization': `Key ${PI_API_KEY}` } });
      if (chk.ok) {
        const pay = await chk.json();
        const md = (pay && pay.metadata) || {};
        const amt = Number(pay && pay.amount);
        const PRICES = {'copa_pass': 1, 'spl_pass': 1, 'fan_pass': 1, 'pilgrim_pass': 1};
        const st = (pay && pay.status) || {};
        if (st.developer_approved) {
          return new Response(JSON.stringify({ approved: true, step: 'already_approved' }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
        }
        if (!(amt > 0) || amt > 100000 || (PRICES[md.type] && amt + 1e-9 < PRICES[md.type])) {
          console.warn('Payment rejected: amount does not match', paymentId, amt, md.type);
          return new Response(JSON.stringify({ approved: false, error: 'Payment amount does not match the price' }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
        }
      }
    } catch (e) { console.warn('Payment check skipped:', e && e.message); }
    const piRes = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}/approve`,
      {
        method: "POST",
        headers: {
          "Authorization": `Key ${PI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      }
    );

    const piRaw = await piRes.text();
    console.log("[FinPi] Pi approve response:", piRes.status, piRaw.substring(0, 300));

    return new Response(
      JSON.stringify({
        approved: true,
        pi_status: piRes.status,
        pi_ok: piRes.ok,
        paymentId
      }),
      { status: 200, headers: CORS }
    );

  } catch (err) {
    console.error("[FinPi] /approve error:", err.message);
    return new Response(
      JSON.stringify({ approved: true, error: err.message }),
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
