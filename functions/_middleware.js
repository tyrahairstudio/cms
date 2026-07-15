const CANONICAL_HOST = "tyrahairstudio.com";
const PAGES_HOST = "tyrahairstudio-git.pages.dev";

function isCmsOrApi(pathname) {
  return pathname === "/tyraadmin" || pathname.startsWith("/tyraadmin/") || pathname.startsWith("/api/");
}

export async function onRequest(context) {
  const host = (context.request.headers.get("host") || "").split(":")[0].toLowerCase();
  const requestUrl = new URL(context.request.url);
  const shouldRedirectWww = host === `www.${CANONICAL_HOST}`;
  const shouldRedirectPagesSite = host === PAGES_HOST && !isCmsOrApi(requestUrl.pathname);

  if (shouldRedirectWww || shouldRedirectPagesSite) {
    const location = `https://${CANONICAL_HOST}${requestUrl.pathname}${requestUrl.search}`;
    return new Response(null, { status: 301, headers: { location } });
  }

  return context.next();
}
