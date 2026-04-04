#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
BASE_DIR="$(cd -- "${SCRIPT_DIR}/.." &> /dev/null && pwd)"
SHELL_DIR="${BASE_DIR}/shell"
EXIT_CODE=0
FORMATS="umd-min"

while getopts "df:" opt; do
  case $opt in
    d)
      FORMATS="umd"
      ;;
    f)
      FORMATS="${OPTARG}"
      ;;
  esac
done

shift $((OPTIND-1))

PKG_NAME="${1:-}"
CREATE_TARBALL="${2:-}"

if [ -z "${PKG_NAME}" ]; then
  echo "Usage: yarn build-pkg <pkg name>"
  exit 1
fi

if [ ! -d "${SHELL_DIR}" ]; then
  SHELL_DIR="${BASE_DIR}/node_modules/@rancher/shell"
  SHELL_DIR="$(cd -P "${SHELL_DIR}" && pwd)"
fi

if [ -z "${VERSION:-}" ]; then
  VERSION="$(cd "${BASE_DIR}/pkg/${PKG_NAME}" && node -p -e "require('./package.json').version")"
fi

SAFE_VERSION="${VERSION//./-}"
NAME="${PKG_NAME}-${SAFE_VERSION}"
PKG_DIST="${BASE_DIR}/dist-pkg/${NAME}"
LEGACY_NAME="${PKG_NAME}-${VERSION}"
LEGACY_PKG_DIST="${BASE_DIR}/dist-pkg/${LEGACY_NAME}"
PKG_DIR="${BASE_DIR}/pkg/${PKG_NAME}"

if [ -d "${PKG_DIR}" ]; then
  echo "Building UI Package ${PKG_NAME}"
  echo "  Package name:    ${NAME}"
  echo "  Package version: ${VERSION}"
  echo "  Output formats:  ${FORMATS}"
  echo "  Output directory: ${PKG_DIST}"
  rm -rf "${PKG_DIST}"
  mkdir -p "${PKG_DIST}"

  pushd "${PKG_DIR}" > /dev/null

  if [ -e ".shell" ]; then
    LINK="$(readlink .shell)"
    if [ "${LINK}" != "${SHELL_DIR}" ]; then
      echo ".shell symlink exists but does not point to expected location - please check and fix"
      popd > /dev/null
      exit 1
    fi
  else
    ln -s "${SHELL_DIR}" .shell
  fi

  FILE="index.js"
  if [ -f "./index.ts" ]; then
    FILE="index.ts"
  fi

  if [ -n "${COMMIT:-}" ]; then
    echo "${COMMIT}" > "${PKG_DIST}/version"
  fi

  "${BASE_DIR}/node_modules/.bin/vue-cli-service" build \
    --name "${NAME}" \
    --target lib \
    "${FILE}" \
    --dest "${PKG_DIST}" \
    --formats "${FORMATS}" \
    --filename "${NAME}"
  EXIT_CODE=$?

  cp -f "./package.json" "${PKG_DIST}/package.json"
  node -e "
    const fs = require('fs');
    const file = process.argv[1];
    const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
    pkg.files = ['**/*'];
    pkg.rancher = true;
    pkg.main = '${NAME}.umd.min.js';
    delete pkg.scripts;
    delete pkg.browserslist;
    fs.writeFileSync(file, JSON.stringify(pkg, null, 2));
  " "${PKG_DIST}/package.json"
  rm -rf "${PKG_DIST}"/*.bak
  rm -rf "${LEGACY_PKG_DIST}"
  cp -R "${PKG_DIST}" "${LEGACY_PKG_DIST}"
  rm -f .shell

  popd > /dev/null
fi

if [ "${EXIT_CODE}" -ne 0 ]; then
  exit "${EXIT_CODE}"
fi

if [ -n "${CREATE_TARBALL}" ]; then
  echo "${COMMIT:-} ${COMMIT_BRANCH:-}" > "${PKG_DIST}/version-commit.txt"

  TARBALL="${NAME}.tar.gz"

  pushd "${PKG_DIST}" > /dev/null
  rm -f "../${TARBALL}"
  echo "Compressing to ${TARBALL}..."
  tar -czf "../${TARBALL}" .
  popd > /dev/null
fi

exit "${EXIT_CODE}"
