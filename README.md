# Enterprise AI Keycloak login theme

Version-locked Keycloak 26.7.2 login theme for the enterprise AI portal. The current layout follows the approved Bento reference: enterprise capabilities on the left and Keycloak's native authentication states on the right. The scan-login tab is a clearly labelled inactive placeholder; no QR authentication flow is implemented.

## Build

```bash
node tests/static-check.mjs
./scripts/build-theme.sh
```

The deployable provider is `dist/enterprise-ai-keycloak-theme-1.0.0.jar`; verify it with `dist/SHA256SUMS`.

## Isolated acceptance

The fixture credentials in `test/realm-enterprise-ai-theme-test.json` are local test data only and must never be used in production.

```bash
docker compose -f test/compose.yml pull
docker compose -f test/compose.yml up -d
curl -fsS http://127.0.0.1:18080/realms/enterprise-ai-theme-test/.well-known/openid-configuration >/dev/null
node tests/browser-check.mjs
docker compose -f test/compose.yml down
```

Screenshots are written to `test-output/`.

Use `tests/production-smoke.mjs` only for read-only checks against the configured production origin. It does not submit credentials.

## Production deployment boundary

Before any server write, confirm SSH access, resolve the current Keycloak Compose service and Realm state read-only, create a protected backup, compare SHA-256 on both hosts, and recreate only Keycloak. The latest deployment and rollback evidence is recorded in `test-output/2026-10-02-bento-remote-acceptance.md`; the older carousel plan is historical only.

Do not modify users, roles, clients, authentication flows, PostgreSQL volumes, Caddy, or the portal application as part of theme deployment. If authentication acceptance fails, restore the previous Realm `loginTheme` and Compose configuration from the recorded backup before further diagnosis.
