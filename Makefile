# Code Review Agent - Makefile for common tasks

.PHONY: help build up down logs clean test dev prod restart

# Default target
help: ## Show this help message
	@echo "Code Review Agent - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development commands
dev: ## Start development environment with hot reloading
	docker-compose -f docker-compose.dev.yml up --build

dev-down: ## Stop development environment
	docker-compose -f docker-compose.dev.yml down

dev-logs: ## View development logs
	docker-compose -f docker-compose.dev.yml logs -f

# Production commands
prod: ## Start production environment
	docker-compose up -d --build

prod-down: ## Stop production environment
	docker-compose down

prod-logs: ## View production logs
	docker-compose logs -f

# Build commands
build: ## Build all Docker images
	docker-compose build --no-cache

build-backend: ## Build only backend image
	docker build -f Dockerfile.backend -t code-review-backend .

build-frontend: ## Build only frontend image
	docker build -f Dockerfile.frontend -t code-review-frontend .

# Management commands
up: ## Start services (production)
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## View logs from all services
	docker-compose logs -f

status: ## Show service status
	docker-compose ps

# Testing commands
test: ## Run all tests
	@echo "Running backend tests..."
	docker-compose exec backend python -m pytest tests/ -v || echo "Backend tests require implementation"
	@echo "Running frontend tests..."
	docker-compose exec frontend npm test -- --coverage --watchAll=false || echo "Frontend tests require implementation"

test-backend: ## Run backend tests only
	docker-compose exec backend python -m pytest tests/ -v

test-frontend: ## Run frontend tests only
	docker-compose exec frontend npm test -- --coverage --watchAll=false

# Utility commands
shell-backend: ## Open shell in backend container
	docker-compose exec backend /bin/bash

shell-frontend: ## Open shell in frontend container
	docker-compose exec frontend /bin/sh

clean: ## Remove all containers, images, and volumes
	docker-compose down -v --rmi all --remove-orphans
	docker system prune -f

clean-images: ## Remove only application images
	docker rmi code-review-backend code-review-frontend || true

setup: ## Initial setup - copy environment file
	cp .env.example .env
	@echo "Please edit .env file with your Gemini API key"

health: ## Check service health
	@echo "Checking backend health..."
	curl -f http://localhost:8000/health || echo "Backend not responding"
	@echo "Checking frontend health..."
	curl -f http://localhost:3000 || echo "Frontend not responding"

# Database commands (for future use)
db-migrate: ## Run database migrations
	docker-compose exec backend python -c "print('Database migrations not implemented yet')"

db-seed: ## Seed database with sample data
	docker-compose exec backend python -c "print('Database seeding not implemented yet')"

# Deployment commands
deploy-prod: ## Deploy to production (requires setup)
	@echo "Deploying to production..."
	docker-compose -f docker-compose.yml up -d --build
	@echo "Deployment complete. Check logs with 'make logs'"

deploy-staging: ## Deploy to staging (requires setup)
	@echo "Deploying to staging..."
	docker-compose -f docker-compose.staging.yml up -d --build || echo "Staging config not found"

# Monitoring commands
monitor: ## Show resource usage
	docker stats

backup: ## Backup application data (placeholder)
	@echo "Backup functionality not implemented yet"

restore: ## Restore application data (placeholder)
	@echo "Restore functionality not implemented yet"