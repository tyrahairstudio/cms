const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";

function textResponse(message, status = 200) {
  return new Response(message, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

export function onRequestGet({ request, env }) {
  if (!env.GITHUB_CLIENT_ID) {
    return textResponse("Missing GITHUB_CLIENT_ID on Cloudflare Pages.", 500);
  }

  const url = new URL(request.url);
  const provider = url.searchParams.get("provider") || "github";

  if (provider !== "github") {
    return textResponse("Unsupported OAuth provider.", 400);
  }

  const redirectUri = `${url.origin}/api/callback`;
  const state = crypto.randomUUID();
  const githubUrl = new URL(GITHUB_AUTHORIZE_URL);
  githubUrl.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  githubUrl.searchParams.set("redirect_uri", redirectUri);
  githubUrl.searchParams.set("scope", "repo");
  githubUrl.searchParams.set("state", state);

  return Response.redirect(githubUrl.toString(), 302);
}
