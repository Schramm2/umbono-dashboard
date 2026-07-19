# =========================================================================
# Umbono - AI Evaluation Dashboard Makefile
# =========================================================================
# Provides convenient shortcuts for the Umbono web application.
# =========================================================================

.PHONY: help install setup dev demo start build export-showcase lint typecheck test verify clean

help: ## Show this help message with descriptions of targets
	@echo "Umbono AI Dashboard Developer Commands:"
	@echo "-----------------------------------------------------------------"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install project dependencies locally
	npm install

setup: ## Create .env.local without overwriting existing configuration
	npm run setup

dev: ## Run the local development server
	npm run dev

demo: ## Alias for the deterministic local showcase
	npm run demo

start: ## Run a completed production build
	npm run start

build: ## Build the production Next.js application
	npm run build

export-showcase: ## Create a standalone demo-only source tree
	npm run export:showcase

lint: ## Run Next.js and ESLint code checks
	npm run lint

typecheck: ## Verify the active TypeScript product surface
	npm run typecheck

test: ## Run focused scoring and aggregation tests
	npm test

verify: ## Run tests, type checks, lint, and the production build
	npm run verify

clean: ## Clean up local build cache and output folders
	rm -rf .next/ out/ build/ .test-dist/
