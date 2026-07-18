#!/bin/sh

set -eu

repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
target=${1:-"$repo_root/showcase-export"}

if [ -e "$target" ]; then
  echo "Refusing to overwrite existing export target: $target" >&2
  exit 1
fi

mkdir -p "$target/lib" "$target/pages" "$target/styles" "$target/tests" "$target/docs/media" "$target/scripts" "$target/.github/workflows"

for file in LICENSE README.md Makefile package.json package-lock.json next.config.js postcss.config.js tailwind.config.js tsconfig.json tsconfig.tests.json eslint.config.mjs .gitattributes .gitignore; do
  cp "$repo_root/$file" "$target/$file"
done

cp "$repo_root/lib/evaluation.ts" "$target/lib/evaluation.ts"
cp "$repo_root/pages/_app.tsx" "$target/pages/_app.tsx"
cp "$repo_root/pages/index.tsx" "$target/pages/index.tsx"
cp "$repo_root/styles/globals.css" "$target/styles/globals.css"
cp "$repo_root/tests/evaluation.test.ts" "$target/tests/evaluation.test.ts"
cp "$repo_root/docs/calculations.md" "$target/docs/calculations.md"
cp "$repo_root/docs/media/shot-list.md" "$target/docs/media/shot-list.md"
cp "$repo_root/scripts/export-showcase.sh" "$target/scripts/export-showcase.sh"
cp "$repo_root/.github/workflows/verify.yml" "$target/.github/workflows/verify.yml"

chmod +x "$target/scripts/export-showcase.sh"

if rg -n -i --hidden -g '!package-lock.json' -g '!**/scripts/**' -e 'file:///Users/' -e 'your-username' -e 'API_KEY' -e 'SERVICE_ROLE' -e 'supabase' -e '@anthropic-ai' -e '@google/generative-ai' -e '@mistralai' -e "from 'openai'" "$target"; then
  echo "Export blocked: a forbidden production or machine-local reference was found." >&2
  exit 1
fi

echo "Created sanitized showcase source at: $target"
echo "Review the tree, run npm ci && npm run verify there, and obtain publication approval before creating or publishing a repository."
