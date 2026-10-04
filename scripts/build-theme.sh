#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
theme_root="$(cd "${script_dir}/.." && pwd)"
build_dir="${theme_root}/dist/build"
artifact="${theme_root}/dist/enterprise-ai-keycloak-theme-1.0.0.jar"

rm -rf "${build_dir}"
mkdir -p "${build_dir}" "${theme_root}/dist"
cp -R "${theme_root}/src/main/resources/." "${build_dir}/"

rm -f "${artifact}"
jar --create \
  --file "${artifact}" \
  --date="2026-09-01T00:00:00+08:00" \
  -C "${build_dir}" .
unzip -tq "${artifact}"

(
  cd "${theme_root}/dist"
  shasum -a 256 "$(basename "${artifact}")" > SHA256SUMS
)

echo "built ${artifact}"
