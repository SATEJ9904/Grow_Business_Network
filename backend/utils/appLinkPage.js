/**
 * Renders the HTML shown when a "gbn://" deep link is opened over HTTPS.
 *
 * On a device with the app installed and the platform deep-link config
 * verified (iOS Universal Links / Android App Links), the OS intercepts
 * this URL before it ever reaches a browser. This page only renders as a
 * fallback: the app isn't installed, or verification hasn't completed yet.
 * It still tries the custom scheme once (works for iOS Mail's in-app
 * browser and most Android browsers even without verified App Links),
 * then offers store links.
 */

const IOS_APP_STORE_URL = "https://apps.apple.com/app/id6809430066";
const ANDROID_PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.gbnsocialassociation";

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function renderAppOpenPage({ title, message, customSchemeUrl }) {
  const safeAppUrl = escapeHtml(customSchemeUrl);

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: -apple-system, Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 40px 20px; color: #333; }
          .card { max-width: 420px; margin: 0 auto; background: white; padding: 28px 24px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); text-align: center; }
          h1 { font-size: 20px; margin: 0 0 12px; color: #0b3d2e; }
          p { line-height: 1.5; color: #555; margin: 0 0 20px; }
          a.button { display: block; padding: 13px; margin: 10px 0; border-radius: 8px; text-decoration: none; font-weight: bold; }
          a.open { background: #0b3d2e; color: white; }
          a.store { background: #f0f0f0; color: #333; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>${escapeHtml(title)}</h1>
          <p id="status">${escapeHtml(message)}</p>
          <a class="button open" id="openAppLink" href="${safeAppUrl}">Open GBN App</a>
          <a class="button store" href="${IOS_APP_STORE_URL}">Download on the App Store</a>
          <a class="button store" href="${ANDROID_PLAY_STORE_URL}">Get it on Google Play</a>
        </div>
        <script>
          // Best-effort immediate attempt for contexts (iOS Mail's in-app
          // browser, some Android browsers) where the OS doesn't intercept
          // this HTTPS link before it loads, but does honor the custom
          // scheme redirect that follows.
          window.location.href = ${JSON.stringify(customSchemeUrl)};
          setTimeout(function () {
            var status = document.getElementById('status');
            if (status) {
              status.textContent = "Don't have the app installed? Get it below, or tap Open GBN App again once it's installed.";
            }
          }, 1500);
        </script>
      </body>
    </html>
  `;
}

module.exports = { renderAppOpenPage };
