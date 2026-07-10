const LOCAL_PREVIEW_ORIGIN = /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d{1,5})?$/;

function appendVary(headers, value) {
  const existing = headers.get("vary");
  const values = new Set((existing || "").split(",").map((item) => item.trim()).filter(Boolean));
  values.add(value);
  headers.set("vary", [...values].join(", "));
}

export async function onRequest(context) {
  const origin = context.request.headers.get("origin") || "";
  const response = await context.next();

  if (!LOCAL_PREVIEW_ORIGIN.test(origin)) return response;

  const headers = new Headers(response.headers);
  headers.set("access-control-allow-origin", origin);
  headers.set("access-control-allow-methods", "GET, POST, OPTIONS");
  headers.set("access-control-allow-headers", "content-type, accept");
  headers.set("access-control-max-age", "86400");
  appendVary(headers, "Origin");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
