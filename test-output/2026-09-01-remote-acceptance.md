# Keycloak login theme remote acceptance

- Target: `cntracer-pc`, Compose project `enterprise-ai`, service `keycloak`
- Keycloak: `quay.io/keycloak/keycloak:26.7.2`
- Theme: `enterprise-ai`
- Artifact: `enterprise-ai-keycloak-theme-1.0.0.jar`
- Artifact SHA-256: `0f9d743efacce39282b5f27a9d3be6c8a30cf6a3b8b4d3c57a068bea32b0a700`
- Initial backup: `/srv/enterprise-ai/config/backups/20260901-140255-keycloak-login-theme`
- Pre-correction backup: `/srv/enterprise-ai/config/backups/20260901-144235-keycloak-login-theme-v2`
- Pre-interaction-fix backup: `/srv/enterprise-ai/config/backups/20260901-150550-keycloak-login-theme-v3`
- Pre-background-alignment backup: `/srv/enterprise-ai/config/backups/20260901-152414-keycloak-login-theme-v4`
- Pre-gradient-reduction backup: `/srv/enterprise-ai/config/backups/20260908-023308-keycloak-login-theme-v5`
- Pre-light-blue-and-80-percent-layout backup: `/srv/enterprise-ai/config/backups/20260908-090329-keycloak-login-theme-v6`

## Changes

- Added one read-only Keycloak provider mount in `/srv/enterprise-ai/config/compose.yml`.
- Added `"loginTheme": "enterprise-ai"` to `/srv/enterprise-ai/config/keycloak-realm.json` for configuration consistency.
- Set the running `enterprise-ai` Realm `loginTheme` to `enterprise-ai` through `kcadm.sh`.
- Recreated only the `keycloak` Compose service.
- Replaced the former third slide with the approved goal-measurement visual, removed the added white company-logo plate, changed the desktop split to 60/40, and changed slide rendering from crop-style `cover` to full-image `contain`.
- Standardized all three slides to an `868×796` canvas and applied the same transparent company Logo at the same pixel position and size.
- Increased the desktop left panel from 60% to 65%, removed hover/focus autoplay cancellation, and removed the inner input focus outline that caused a double frame.
- Trimmed the old preview card edges, rebuilt all three diagrams on the same `868×796` pale-blue background, and feathered each retained diagram by 24px so the enlarged left panel no longer shows an inner background layer.
- Added `carousel-background.webp` as the exact shared background for both the slide assets and the CSS visual panel.
- Replaced the shared background with V2: a near-white cool canvas without horizontal gradient, vignette, or blue-darkened side edges; retained only an extremely weak vertical tonal variation.
- Replaced the shared background with the approved-strength light ice-blue canvas while preserving equal left/center/right brightness, and resized the desktop shell to `min(80vw, 1447px)` by `min(80vh, 792px)`.

## Verification

- Static theme checks: PASS.
- Reproducible JAR and ZIP integrity: PASS.
- Remote isolated Keycloak 26.7.2 browser suite: PASS.
- Covered A-v3 → D → goal-measurement ordering, 5000ms autoplay, pause, dots, keyboard, reduced motion, mobile no-autoplay, JavaScript-disabled fallback, wrong credentials, and correct OIDC authorization-code redirect.
- Explicitly covered autoplay while the mouse remains over the carousel and after a carousel control retains focus; both advanced after 5000ms. Manual pause remained effective.
- `desktop-input-focus.png` confirms the username input shows one focus treatment; computed input outline and box shadow are both `none`.
- Visually reviewed `desktop-slide-a.png`, `desktop-slide-d.png`, and `desktop-slide-goal.png`: all three diagrams are complete, their transparent-background Logo position/size is consistent, and no inner card/background boundary is visible.
- V2 source-background mean RGB values were `(247.62, 249.06, 252.94)` at the left, `(247.53, 248.99, 252.95)` at the center, and `(247.49, 248.97, 252.91)` at the right; this confirms there is no material horizontal edge darkening.
- Final source-background mean RGB values are `(243.14, 245.21, 251.29)` at the left, `(243.03, 245.16, 251.32)` at the center, and `(243.10, 245.17, 251.29)` at the right. At the 1440×1000 desktop test viewport, the rendered shell measured approximately 1152×790 pixels (80% width and 79% height).
- Production Caddy-to-Keycloak discovery endpoint: HTTP 200.
- Production login HTML: carousel, correct slide order including `slide-goal.webp`, product logo, Chinese title, native Keycloak form, and login button present.
- Production CSS: 65/35 columns, `80vw`/`80vh` desktop shell sizing, the shared `carousel-background.webp`, single input focus treatment, and `object-fit: contain` present; obsolete `object-fit: cover` absent.
- Production JavaScript: `AUTOPLAY_MS = 5000` present; hover/focus pause listeners absent.
- Production Keycloak container: running, restart count 0, provider mounted read-only.
- Production Keycloak logs: no `ERROR`, `FATAL`, missing-theme, or theme-load failures after deployment.
- The Compose operation output recreated only Keycloak. A concurrent external operation independently recreated LibreChat later (`RestartCount=0`, start time after Keycloak, and no LibreChat action in this Compose output); its Caddy route returned HTTP 200. Other checked services remained running.

## Remaining conditional checks

- No production end-user password was used. A correct login was verified against the isolated remote Realm using the same Keycloak version and final theme structure; the production form and OIDC endpoint were verified without credentials.
- MFA, password-reset email delivery, and other conditional Required Actions were not executed because they require production-specific accounts and policy state.
- Direct HTTPS access from the current workstation returned a connection reset, while the server-local Caddy route returned HTTP 200. This external NAT/network path is separate from the Keycloak theme deployment and was not changed.

## Rollback

Restore the protected backup Compose and Realm files, set the running Realm `loginTheme` back to its prior empty value, and recreate only the `keycloak` service. The original backup checksums are stored in the backup directory.
