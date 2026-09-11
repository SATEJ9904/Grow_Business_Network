/**
 * Renders the public "Account Deletion Request" page.
 *
 * This is the page the mobile app sends a member to (after they confirm
 * password + email OTP in-app) to actually submit their deletion request.
 * It's a plain HTML form - no login required, since a member requesting
 * deletion may not want to (or be able to) sign back into the app - that
 * posts to the existing public POST /api/member/request-deletion endpoint.
 * The request then shows up under "Deletion Requests" on the admin panel,
 * where an admin approves (permanently deletes + archives to DeletedRecord)
 * or rejects (keeps the account, clears the flag) it.
 */

function renderDeletionRequestPage() {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Account Deletion Request — GBN</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: #F3F5F4;
            margin: 0;
            padding: 40px 20px;
            color: #111827;
          }
          .card {
            max-width: 460px;
            margin: 0 auto;
            background: #FFFFFF;
            padding: 32px 28px;
            border-radius: 18px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          }
          .badge {
            display: inline-block;
            background: #FDEDED;
            color: #B3261E;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.5px;
            padding: 6px 12px;
            border-radius: 20px;
            margin-bottom: 14px;
          }
          h1 { font-size: 22px; margin: 0 0 8px; color: #0B3D2E; }
          p.lede { line-height: 1.55; color: #6B7280; margin: 0 0 24px; font-size: 14px; }
          label {
            display: block;
            font-size: 13px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 6px;
          }
          input, textarea {
            width: 100%;
            padding: 12px 14px;
            border: 1px solid #E5E9E7;
            background: #F8FAF9;
            border-radius: 10px;
            font-size: 14px;
            font-family: inherit;
            margin-bottom: 18px;
            color: #111827;
          }
          input:focus, textarea:focus {
            outline: none;
            border-color: #0B3D2E;
          }
          textarea { min-height: 100px; resize: vertical; }
          button {
            width: 100%;
            padding: 14px;
            border: none;
            border-radius: 10px;
            background: #E11D1D;
            color: white;
            font-size: 15px;
            font-weight: 800;
            cursor: pointer;
          }
          button:disabled { opacity: 0.6; cursor: not-allowed; }
          #statusMsg {
            margin-top: 16px;
            padding: 12px 14px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 600;
            display: none;
          }
          #statusMsg.success { display: block; background: #EEF9F0; color: #0B3D2E; }
          #statusMsg.error { display: block; background: #FDEDED; color: #B3261E; }
          #successView { display: none; text-align: center; }
          #successView .icon { font-size: 40px; margin-bottom: 12px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div id="formView">
            <span class="badge">ACCOUNT DELETION</span>
            <h1>Request Account Deletion</h1>
            <p class="lede">
              Confirm the details below exactly as they appear on your GBN account.
              Our team will review your request, and once approved your account
              and all its data will be permanently deleted.
            </p>

            <form id="deletionForm">
              <label for="email">Email Address</label>
              <input type="email" id="email" name="email" placeholder="you@example.com" required />

              <label for="mobile">Mobile Number</label>
              <input type="tel" id="mobile" name="mobile" placeholder="10-digit mobile number" pattern="[0-9]{10}" maxlength="10" required />

              <label for="reason">Reason for Deletion</label>
              <textarea id="reason" name="reason" placeholder="Tell us why you're leaving..." required></textarea>

              <button type="submit" id="submitBtn">Submit Deletion Request</button>
            </form>

            <div id="statusMsg"></div>
          </div>

          <div id="successView">
            <div class="icon">✅</div>
            <h1>Request Submitted</h1>
            <p class="lede" style="margin-bottom: 0;">
              Your account deletion request has been received. Our team will review
              it and process the deletion shortly - you'll no longer be able to log
              in once it's approved.
            </p>
          </div>
        </div>

        <script>
          document.getElementById('deletionForm').addEventListener('submit', async function (e) {
            e.preventDefault();

            var submitBtn = document.getElementById('submitBtn');
            var statusMsg = document.getElementById('statusMsg');
            statusMsg.className = '';
            statusMsg.textContent = '';

            var email = document.getElementById('email').value.trim();
            var mobile = document.getElementById('mobile').value.trim();
            var reason = document.getElementById('reason').value.trim();

            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';

            try {
              var res = await fetch('/api/member/request-deletion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, mobile: mobile, reason: reason }),
              });
              var data = await res.json();

              if (!res.ok || !data.success) {
                throw new Error(data.message || 'Something went wrong. Please try again.');
              }

              document.getElementById('formView').style.display = 'none';
              document.getElementById('successView').style.display = 'block';
            } catch (err) {
              statusMsg.className = 'error';
              statusMsg.textContent = err.message || 'Something went wrong. Please try again.';
              submitBtn.disabled = false;
              submitBtn.textContent = 'Submit Deletion Request';
            }
          });
        </script>
      </body>
    </html>
  `;
}

module.exports = { renderDeletionRequestPage };
