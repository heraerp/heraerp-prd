#!/bin/sh

echo "🚀 Starting HERA ERP Production Services..."

# Function to cleanup on exit
cleanup() {
  echo "Shutting down services..."
  kill $HEALTH_PID $NEXT_PID 2>/dev/null
  exit 0
}

trap cleanup EXIT INT TERM

# Start health check server in background
echo "Starting health check server..."
node health-server.js &
HEALTH_PID=$!

# Give health server time to start
sleep 2

# Start Next.js server
echo "Starting Next.js application..."
export HOSTNAME="0.0.0.0"
npm start &
NEXT_PID=$!

echo "Services started:"
echo "  - Health check server (PID: $HEALTH_PID) on port 3001"
echo "  - Next.js server (PID: $NEXT_PID) on port ${PORT:-3000}"

# Wait for any process to exit
wait -n

# If we get here, one of the processes died
echo "One of the services exited, shutting down..."
cleanup