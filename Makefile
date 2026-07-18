# =========================================================================
# Umbono - AI Evaluation Dashboard Makefile
# =========================================================================
# Provides convenient shortcuts for the deterministic static showcase.
# =========================================================================

.PHONY: help install dev demo build build-demo lint typecheck test verify export-showcase clean

help: ## Show this help message with descriptions of targets
	@echo "Umbono AI Dashboard Developer Commands:"
	@echo "-----------------------------------------------------------------"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install project dependencies locally
	npm install

dev: ## Run the deterministic local showcase
	npm run dev

demo: ## Alias for the deterministic local showcase
	npm run demo

build: ## Build the static showcase into out/
	npm run build

build-demo: ## Alias for the static showcase build
	npm run build:demo

lint: ## Run Next.js and ESLint code checks
	npm run lint

typecheck: ## Verify the canonical TypeScript showcase
	npm run typecheck

test: ## Run focused scoring and aggregation tests
	npm test

verify: ## Run tests, type checks, lint, and the static build
	npm run verify

export-showcase: ## Create a sanitized standalone source tree
	npm run export:showcase

clean: ## Clean up local build cache and output folders
	rm -rf .next/ out/ build/ .test-dist/
