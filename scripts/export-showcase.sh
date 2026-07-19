#!/bin/sh

set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
target=${1:-"$repo_root/showcase-export"}

if [ -e "$target" ]; then
  echo "Refusing to overwrite existing export target: $target" >&2
  exit 1
fi

mkdir -p "$target/lib" "$target/pages" "$target/styles" "$target/tests" "$target/docs/media" "$target/scripts" "$target/.github/workflows"

for file in LICENSE Makefile package.json package-lock.json postcss.config.js tailwind.config.js tsconfig.json tsconfig.tests.json eslint.config.mjs .env.example .gitattributes .gitignore DESIGN.md CONTRIBUTING.md SECURITY.md next.showcase.config.js vercel.showcase.json; do
  cp "$repo_root/$file" "$target/$file"
done

cp "$repo_root/docs/demo-export.md" "$target/README.md"
cp "$repo_root/next.showcase.config.js" "$target/next.config.js"
cp "$repo_root/vercel.showcase.json" "$target/vercel.json"
cp "$repo_root/lib/evaluation.ts" "$target/lib/evaluation.ts"
cp "$repo_root/lib/provider.ts" "$target/lib/provider.ts"
cp "$repo_root/pages/_app.tsx" "$target/pages/_app.tsx"
cp "$repo_root/pages/index.tsx" "$target/pages/index.tsx"
cp "$repo_root/pages/studio.tsx" "$target/pages/studio.tsx"
cp "$repo_root/pages/docs.tsx" "$target/pages/docs.tsx"
cp "$repo_root/styles/globals.css" "$target/styles/globals.css"
cp "$repo_root/tests/evaluation.test.ts" "$target/tests/evaluation.test.ts"
cp "$repo_root/tests/provider.test.ts" "$target/tests/provider.test.ts"
cp "$repo_root/docs/calculations.md" "$target/docs/calculations.md"
cp "$repo_root/docs/configuration.md" "$target/docs/configuration.md"
cp "$repo_root/docs/architecture.md" "$target/docs/architecture.md"
cp "$repo_root/docs/release-checklist.md" "$target/docs/release-checklist.md"
cp "$repo_root/docs/media/shot-list.md" "$target/docs/media/shot-list.md"
cp "$repo_root/docs/demo-export.md" "$target/docs/demo-export.md"
cp "$repo_root/scripts/setup.mjs" "$target/scripts/setup.mjs"
cp "$repo_root/scripts/export-showcase.sh" "$target/scripts/export-showcase.sh"
cp "$repo_root/.github/workflows/verify.yml" "$target/.github/workflows/verify.yml"

chmod +x "$target/scripts/export-showcase.sh"

if rg -n -i --hidden -g '!package-lock.json' -g '!**/export-showcase.sh' -e 'file:///Users/' -e '/Users/[[:alnum:]_.-]+/' -e 'sk-[A-Za-z0-9_-]{16,}' -e 'ghp_[A-Za-z0-9]{16,}' -e 'AKIA[A-Z0-9]{16}' "$target"; then
  echo "Export blocked: a secret-like or machine-local reference was found." >&2
  exit 1
fi

echo "Created demo-only showcase source at: $target"
echo "Run npm ci && npm run verify in the exported tree before publishing or deploying it."
