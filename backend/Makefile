REGISTRY := 10.160.16.60/uiux
IMAGE_NAME := email-service
TAG_NAME := latest
DOCKER_IMAGE := $(REGISTRY)/$(IMAGE_NAME):$(TAG_NAME)

.PHONY: help build push deploy clean

help:
	@echo "Available targets:"
	@echo "  build              - Build Docker image"
	@echo "  push               - Push Docker image to registry"
	@echo "  deploy             - Deploy to Kubernetes"
	@echo "  clean              - Remove built files"
	@echo "  build-and-push     - Build and push Docker image"
	@echo "  full-deploy        - Build, push, and deploy to k8s"

build:
	@echo "Building Docker image: $(DOCKER_IMAGE)"
	docker build -t $(DOCKER_IMAGE) .
	@echo "✓ Build complete"

push:
	@echo "Pushing Docker image: $(DOCKER_IMAGE)"
	docker push $(DOCKER_IMAGE)
	@echo "✓ Push complete"

deploy:
	@echo "Deploying to Kubernetes..."
	kubectl apply -f ../k8s/email-service-configmap.yaml
	kubectl apply -f ../k8s/email-service-deployment.yaml
	@echo "✓ Deployment complete"

clean:
	@echo "Cleaning build artifacts..."
	rm -rf dist node_modules
	@echo "✓ Clean complete"

build-and-push: build push

full-deploy: build push deploy
	@echo "✓ Full deployment complete"
	@echo "Checking pod status..."
	kubectl get pods -l app=email-service
