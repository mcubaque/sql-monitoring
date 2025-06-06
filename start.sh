#!/bin/bash

echo "Starting SQL Server Monitoring System..."

run_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        docker-compose "$@"
    else
        docker compose "$@"
    fi
}

if [ ! -f .env ]; then
    echo "Error: .env file not found. Please configure it."
    exit 1
fi

echo "Building and starting containers..."
run_docker_compose up --build -d

sleep 5

echo "Container status:"
run_docker_compose ps

echo ""
echo "================================="
echo "🎉 SQL Server Monitor Started!"
echo "================================="
echo "✅ Dashboard: http://localhost"
echo "✅ API Docs: http://localhost:8000/docs"
echo "✅ Login: admin / admin123"
echo "✅ SQL Host: $(grep SQL_SERVER_HOST .env | cut -d'=' -f2)"
echo ""
echo "Commands:"
echo "  Stop: docker compose down"
echo "  Logs: docker compose logs -f"
echo "================================="
