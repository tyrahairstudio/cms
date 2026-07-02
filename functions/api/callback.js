const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";

function htmlResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function errorPage(message) {
  return htmlResponse(
    `<!doctype html>
<meta charset="utf-8">
<title>GitHub login failed</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 40px; line-height: 1.5; }
  code { background: #f2f2f2; padding: 2px 6px; border-radius: 4px; }
</style>
<h1>GitHub login failed</h1>
<p>${message}</p>`,
    400
  );
}

function successPage(token) {
  const payload = JSON.stringify({ token, provider: "github" });

  return htmlResponse(`<!doctype html>
<meta charset="utf-8">
<title>GitHub login complete</title>
<p>Login complete. You can close this window.</p>
<script>
  (function () {
    var message = "authorization:github:success:" + ${JSON.stringify(payload)};

    function notifyCms(targetOrigin) {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(message, targetOrigin);
      }
    }

    window.addEventListener("message", function (event) {
      notifyCms(event.origin);
    }, false);

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage("authorizing:github", "*");
    }
  })();
</script>`);
}

export async function onRequestGet({ request, env }) {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return errorPage("Missing <code>GITHUB_CLIENT_ID</code> or <code>GITHUB_CLIENT_SECRET</code> on Cloudflare Pages.");
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return errorPage("GitHub did not return an authorization code.");
  }

  const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "user-agent": "tyra-hair-studio-decap-cms"
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/api/callback`
    })
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok || tokenData.error || !tokenData.access_token) {
    return errorPage(tokenData.error_description || "GitHub token exchange failed.");
  }

  return successPage(tokenData.access_token);
}
