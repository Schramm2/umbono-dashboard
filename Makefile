# =========================================================================
# Umbono - AI Evaluation Dashboard Makefile
# =========================================================================
# Provides convenient shortcut commands for local setup, development,
# and building the showcase demo or production versions of the dashboard.
# =========================================================================

.PHONY: help install dev demo build build-demo lint clean

help: ## Show this help message with descriptions of targets
	@echo "Umbono AI Dashboard Developer Commands:"
	@echo "-----------------------------------------------------------------"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install project dependencies locally
	npm install

dev: ## Run the local Next.js dev server with production mode database settings
	npm run dev

demo: ## Run the self-contained portfolio demo (bypasses Supabase & external LLM APIs)
	npm run demo

build: ## Build the Next.js production bundles (requires production env vars)
	npm run build

build-demo: ## Build the Next.js portfolio showcase demo bundles
	npm run build:demo

lint: ## Run Next.js and ESLint code checks
	npm run lint

clean: ## Clean up local build cache and output folders
	rm -rf .next/ out/ build/
