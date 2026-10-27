/* FINPI · /complete — completes a Pi payment after the user signed it in Pi's window.
   For a transfer, it then runs the automatic delivery (or automatic refund) at once. Always answers HTTP 200 for the Pi SDK. */
import { payout, piApi, rateOk } from './_lib/transfers.js';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const out = (o) => new Response(JSON.stringify(o), { status: 200, headers: cors });

export async function onRequestGet({ env }) { return out({ success: true, ready: !!env.PI_API_KEY }); }
export async function onRequestPost({ request, env }) {
  const b = await request.json().catch(() => ({}));
  const pid = String(b.paymentId || ''), txid = String(b.txid || '');
  if (!/^[A-Za-z0-9_-]{6,80}$/.test(pid) || !/^[A-Fa-f0-9]{64}$/.test(txid)) return out({ completed: false, error: 'Invalid payment details' });
  if (!env.PI_API_KEY) return out({ completed: false, error: 'Payments are not switched on yet' });
  if (!(await rateOk(env, request, 'complete', 120))) return out({ completed: false, error: 'Too many attempts. Please wait a while.' });
  try {
    const r = await piApi(env, '/payments/' + encodeURIComponent(pid) + '/complete', 'POST', { txid });
    let transfer = null;
    const g = await piApi(env, '/payments/' + encodeURIComponent(pid));
    const done = r.ok || (g.ok && g.d && g.d.status && g.d.status.developer_completed);
    if (done && g.d && g.d.metadata && g.d.metadata.type === 'transfer') {
      try { transfer = await payout(env, request, pid); } catch (e) { transfer = { ok: false, retry: true, error: 'Delivery will be retried automatically' }; }
    }
    return out({ completed: !!done, pi_status: r.status, transfer });
  } catch (e) {
    console.error('complete failed', pid, e && e.message);
    return out({ completed: false, error: 'Could not complete right now. FinPi will finish it automatically when you reopen the app.' });
  }
}
export async function onRequestOptions() { return new Response(null, { status: 204, headers: cors }); }
