# Upstream baseline

The customized layout starts from Keycloak `26.7.2` and must be reviewed when Keycloak is upgraded.

| File | Official source | SHA-256 |
| --- | --- | --- |
| `template.ftl` | `https://raw.githubusercontent.com/keycloak/keycloak/26.7.2/themes/src/main/resources/theme/keycloak.v2/login/template.ftl` | `6221a3176c73a3fd67abc97076deb9cef112378ce157735a78bd865800315b37` |
| `theme.properties` | `https://raw.githubusercontent.com/keycloak/keycloak/26.7.2/themes/src/main/resources/theme/keycloak.v2/login/theme.properties` | `f5032f39aabb1e0dc940564937263fb0dfb99c534ec0a1f92dea6c4baf0e03e2` |

Retrieved and verified on 2026-09-01. The child theme inherits `keycloak.v2`; only `template.ftl` is vendored because the two-column shell must surround every login state.
