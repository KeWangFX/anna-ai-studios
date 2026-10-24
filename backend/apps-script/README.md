# Anna AI Studios mail backend

Maintained source for the owner-authorised Google Apps Script Web App version 1 deployed on 24 October 2026. The exact public endpoint is configured in both homepage form actions; deployment IDs are not secrets. These files are excluded from the static site's explicit public-file manifest.

- `Code.gs`: native URL-encoded POST handler, strict field validation, Turnstile server verification, quota/rate limits, idempotent send states, and bilingual result/receipt copy.
- `appsscript.json`: V8/UTC manifest with only `script.send_mail` and `script.external_request` OAuth scopes.
- `test_backend.cjs`: deterministic offline tests; its secret/token literals are deliberately invalid fixtures. No test contacts a provider or sends mail.

Operational properties are set only in the owner Apps Script project. `TURNSTILE_SECRET` must never enter this repository, generated HTML, logs or public build. `ANNA_ENABLED=true` permits delivery; keep it false while verifying a new deployment. `deploymentPreflight()` reports remaining recipient quota, enablement and secret presence without returning the secret. The authorised preflight returned 100 remaining recipients and secret present; the deployed backend is now enabled for controlled real-mail validation. Rerun it before each controlled rollout because quota and configuration can change.

Google consumer MailApp currently permits 100 recipients per day. This backend is stricter: 20 enquiries per rolling 24 hours, 5 per rolling hour, 2 per submitting address per rolling day; each enquiry sends a fixed owner notification and a fixed visitor receipt, retaining a two-recipient reserve. Verification work is bounded separately to 200 attempts per rolling day and 10 per minute. Those shared budgets can be exhausted by invalid traffic; no DDoS-resistance claim is made. Limits stop execution rather than use a paid fallback. Official quotas: https://developers.google.com/apps-script/guides/services/quotas

`privacy_consent` must be exactly `Agreed`. Frontend HTML-to-backend parser tests live in `scripts/test_contact_contract.cjs`; these catch enum/field drift across languages. Run `npm run validate` after changing either side. When Code.gs changes, update the existing Web App deployment version as well as this source; saving source alone does not update a versioned `/exec` deployment.

MailApp's return means acceptance by the sending API, not final inbox delivery. Closure requires marked Chinese and English enquiries with matching Lead IDs, original Chinese payload preserved in the studio notification, and the corresponding receipt in the submitter mailbox. Google access from mainland China remains unverified; retain direct-contact fallbacks. No backend source, tests, manifest, operational properties or credentials belong in `cloudflare-release/`.
