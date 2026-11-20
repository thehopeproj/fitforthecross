// fitforthecross.com/daily-fuel/ : today's DAILY FUEL (Cloudflare Pages Function).
// Serves the pre-built page for today's US Central date from /daily-fuel/today/YYYY-MM-DD/, switching at midnight Central.
// If today isn't built (not LOCKED), serves the latest LOCKED day before today; never an empty page.
// Pages are built by daily-fuel-sessions/build_today_pages.py.
export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  if (url.pathname === '/daily-fuel') return Response.redirect(url.origin + '/daily-fuel/' + url.search, 301);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  let days = [];
  try { days = await (await env.ASSETS.fetch(new URL('/daily-fuel/today/days.json', url.origin))).json(); } catch (e) {}
  const past = days.filter(d => d <= today);
  const pick = past.length ? past[past.length - 1] : days[0];
  if (!pick) return env.ASSETS.fetch(new URL('/', url.origin));
  const res = await env.ASSETS.fetch(new URL('/daily-fuel/today/' + pick + '/', url.origin));
  const out = new Response(res.body, res);
  out.headers.delete('X-Robots-Tag');            // the per-day copies are noindex; this URL is the one to index
  out.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  return out;
}
