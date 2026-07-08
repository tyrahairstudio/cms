export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.hostname === "tyrahairstudio.com") {
    url.hostname = "www.tyrahairstudio.com";
    return Response.redirect(url.toString(), 302);
  }

  return context.next();
}
