# Wiring the forms to Google Sheets (~10 min)

Both forms on the site — the **Build Your Catering Order** flow and the
**specialty pre-order waitlist** — submit to a Google Sheet and email you.
Until you finish these steps, the forms fall back to opening a pre-filled
email so nothing is ever lost.

## 1. Create the Sheet
1. Go to [sheets.new](https://sheets.new) and name it **Papa N Toots — Leads**.
2. Leave it empty. The script creates the tab + headers automatically.

## 2. Add the script
1. In the sheet: **Extensions → Apps Script**.
2. Delete the placeholder `Code.gs` content.
3. Paste in the entire contents of [`google-apps-script.js`](google-apps-script.js).
4. (Optional) Edit `NOTIFICATION_EMAIL` at the top if you want alerts sent
   somewhere other than `papantoots@gmail.com`.
5. **Save** (💾).

## 3. Test it
1. In the toolbar, choose the `testSetup` function and click **Run**.
2. Approve the permissions prompt (Google asks once — choose your account,
   "Advanced → Go to project", **Allow**).
3. Check the sheet: a **Leads** tab appears with two test rows. Check your
   inbox for the notification emails. Delete the test rows when done.

## 4. Deploy as a Web App
1. **Deploy → New deployment**.
2. Type: **Web app**.
3. Description: `Papa N Toots forms`.
4. Execute as: **Me**.
5. Who has access: **Anyone**.  ← required so the website can post to it.
6. **Deploy** → copy the **Web app URL** (ends in `/exec`).

## 5. Paste the URL into the site
1. Open [`index.html`](index.html).
2. Find this line (near the top of the `<script>`):
   ```js
   const GOOGLE_SHEET_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
   ```
3. Replace the placeholder with your `/exec` URL. Save, commit, redeploy.

That's it. Every catering inquiry and pre-order now lands in the sheet with
a colored status dropdown (New → Contacted → Quoted → Confirmed → Done), you
get an email, and the customer gets an auto-reply.

> **Updating the script later?** After editing `google-apps-script.js`, in
> Apps Script do **Deploy → Manage deployments → ✏️ Edit → Version: New
> version → Deploy**. The URL stays the same.
