# Keycloak Bento login theme remote acceptance

- Target: enterprise AI platform server, Compose project `enterprise-ai`, service `keycloak`
- Keycloak: `quay.io/keycloak/keycloak:26.7.2`
- Theme: `enterprise-ai`
- Artifact: `enterprise-ai-keycloak-theme-1.0.0.jar`
- Artifact SHA-256: `7af537c7a40e75b149af807a9dfe5a75218736feb277953b3288378e35730c1c`
- Protected rollback backups:
  - Bento layout: `/srv/enterprise-ai/config/backups/20261002-020840-keycloak-login-theme-v7-bento`
  - Input-field refinement: `/srv/enterprise-ai/config/backups/20261002-023650-keycloak-login-input-v8`
  - Account placeholder update: `/srv/enterprise-ai/config/backups/20261002-keycloak-login-account-placeholder`

## Implemented scope

- Replaced the former three-slide carousel with the approved Bento-style two-column login shell.
- Added the four capability cards: AI workbench, data center, knowledge center, and application center.
- Retained the native Keycloak username, password, remember-me, password-reset, error, and OIDC submission paths.
- Added account-login and scan-login tabs. The scan tab is presentation-only and explicitly states that the function is not enabled; it contains no QR data, network request, or authentication implementation.
- Added responsive desktop/mobile layouts and removed the duplicated inner focus frame from the username and password inputs.
- Matched the reference HTML input controls: unified pale-gray rounded fields, reference placeholders, hover state, white/blue focus state, and an in-field password visibility button without a segmented border.
- Updated the username placeholder to `请输入登录账号`.

## Verification

- Static theme checks: PASS.
- Deterministic JAR build and ZIP integrity: PASS.
- Remote isolated Keycloak 26.7.2 browser suite: PASS.
- Desktop shell: 1080px wide and approximately 631px high at a 1440x1000 viewport.
- Covered all four cards, brand assets, tab mouse/keyboard interaction, inactive scan placeholder, JavaScript-disabled account fallback, mobile no-overflow layout, incorrect credentials, and successful OIDC authorization-code redirect in the isolated realm.
- Production discovery endpoint through server-local Caddy: HTTP 200.
- Production discovery endpoint through the public origin: HTTP 200.
- Production login page through the public origin: Chrome render and tab interaction smoke check PASS.
- Production input-field checks through the public origin: both placeholders, pale-gray resting surfaces, borderless password toggle, and completed blue focus transition PASS.
- Production portal route: HTTP 200.
- Production Keycloak container: running, restart count 0.
- Production Keycloak logs: no `ERROR`, `FATAL`, or template-processing failures after deployment.
- Only the Keycloak Compose service was recreated. Existing orphan containers reported by Compose were not removed.

## Remaining boundary

- No production user password was used. The actual credential flow was verified only in the isolated realm using the same Keycloak version and deployed theme artifact.
- Scan login is intentionally not implemented in this delivery.
- MFA, password-reset email delivery, and production-specific required actions remain conditional on production accounts and policy state.

## Rollback

The eyebrow addition was rolled back from local source and production. The deployed provider now has SHA-256 `21f5c4eed7289707b75db7034c194f24ab26f948eee27f7113b5cbf410618a88`; the public smoke check confirms that the eyebrow is absent while the Bento layout and input-field refinement remain.

Before replacement, the eyebrow provider was preserved at `/srv/enterprise-ai/config/backups/20261002-rollback-eyebrow-v9`. Only the `keycloak` Compose service was recreated; the portal route remained HTTP 200 and the Keycloak container returned to `running` with restart count 0.
