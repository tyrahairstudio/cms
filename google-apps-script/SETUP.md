# Tyra Booking1 — Google Apps Script setup

The Google Sheet is already prepared at:

`https://docs.google.com/spreadsheets/d/1wgYYOZNoN4BDtTlIUYwgVy4Ipn_o7QTYy0qBzc1lMj4`

## 1. Add the Apps Script

Open the spreadsheet, then choose **Extensions → Apps Script**.

1. Replace the editor contents with `Code.gs` from this folder.
2. In **Project Settings**, enable **Show appsscript.json manifest file**.
3. Replace the manifest with `appsscript.json` from this folder.
4. Run `setupBookingSystem` once and approve the requested Google Sheets and email permissions.
5. Open the execution log and copy the value after `BOOKING_WEBHOOK_SECRET=`.

The generated secret is stored in Apps Script Properties. It is not stored in the public website or this Git repository.

## 2. Deploy as a Web app

Choose **Deploy → New deployment → Web app**:

- Execute as: **Me**
- Who has access: **Anyone**

Current deployed Web app URL:

`https://script.google.com/macros/s/AKfycbyr3KlC6GcxTsp-VT3LXfRR4jbV4-Yqu3qtePM7Ai92ucyf3I89OdiHucgt2aypeVqdkA/exec`

Use the deployed `/exec` URL, never the editor `/dev` URL.

## 3. Add Cloudflare Pages secrets

In the Cloudflare Pages project `tyrahairstudio-git`, add this encrypted Production secret:

- `BOOKING_WEBHOOK_SECRET`: the secret printed by `setupBookingSystem`

The current Apps Script `/exec` URL is already configured in the server function. `BOOKING_APPS_SCRIPT_URL` remains an optional override for a future deployment URL.

Store the webhook secret as encrypted. Redeploy the latest commit after adding it.

## Security notes

- The browser sends booking data only to `/api/booking` on the Tyra site.
- The Cloudflare Function adds a timestamp and HMAC-SHA256 signature before forwarding to Apps Script.
- Apps Script rejects requests with an invalid signature or a timestamp older than five minutes.
- Google email is sent with `MailApp` after the owner authorizes the script. A Gmail app password is not used or stored anywhere.
- If a password was shared outside Google Account settings, revoke it and create a new one.

## Test

After deployment, open `/booking1/`, select a short service and a time, then send a real test request. Verify:

1. a row appears in the `booking` sheet;
2. the owner notification arrives at `tyrahairstudio.com@gmail.com`;
3. the customer receives a request receipt;
4. the selected time becomes unavailable for overlapping appointments.
