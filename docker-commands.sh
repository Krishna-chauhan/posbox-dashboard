#!/bin/bash

# Docker Compose Commands for Dashboard Application

case "$1" in
    "build")
        echo "Building dashboard application..."
        docker-compose build
        ;;
    "up")
        echo "Starting dashboard application..."
        docker-compose up -d
        ;;
    "down")
        echo "Stopping dashboard application..."
        docker-compose down
        ;;
    "restart")
        echo "Restarting dashboard application..."
        docker compose restart dashboard
        ;;
    "logs")
        echo "Showing dashboard logs..."
        docker-compose logs -f dashboard
        ;;
    "dev")
        echo "Starting development environment..."
        docker-compose -f docker-compose.dev.yml up -d
        ;;
    "dev-down")
        echo "Stopping development environment..."
        docker-compose -f docker-compose.dev.yml down
        ;;
    "clean")
        echo "Cleaning up containers and images..."
        docker-compose down --rmi all --volumes --remove-orphans
        ;;
    "status")
        echo "Dashboard application status:"
        docker-compose ps
        ;;
    *)
        echo "Usage: $0 {build|up|down|restart|logs|dev|dev-down|clean|status}"
        echo ""
        echo "Commands:"
        echo "  build     - Build the dashboard application"
        echo "  up        - Start the dashboard application"
        echo "  down      - Stop the dashboard application"
        echo "  restart   - Restart the dashboard application"
        echo "  logs      - Show application logs"
        echo "  dev       - Start development environment"
        echo "  dev-down  - Stop development environment"
        echo "  clean     - Clean up containers and images"
        echo "  status    - Show application status"
        exit 1
        ;;
esac
