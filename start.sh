#!/bin/bash

echo "🚀 Starting Code Review Agent..."

# Check if required tools are installed
command -v python3 >/dev/null 2>&1 || { echo "❌ Python 3 is required but not installed."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed."; exit 1; }

# Function to cleanup background processes
cleanup() {
    echo "🛑 Shutting down servers..."
    jobs -p | xargs -r kill
    exit 0
}

# Trap to cleanup on script exit
trap cleanup EXIT

echo "📦 Installing dependencies..."

# Activate the existing virtual environment
echo "Activating virtual environment..."
source .venv/bin/activate

# Install backend dependencies
echo "Installing Python dependencies..."
pip install -r backend/requirements.txt

# Check for .env file
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Warning: backend/.env file not found!"
    echo "Please create a backend/.env file with your GEMINI_API_KEY"
    echo "Example: GEMINI_API_KEY=your_api_key_here"
fi

# Install frontend dependencies
echo "Installing Node.js dependencies..."
cd frontend
npm install
cd ..

echo "🎯 Starting servers..."

# Start backend
echo "Starting backend server on http://localhost:8000..."
cd backend
python main.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "Starting frontend server on http://localhost:3000..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo "✅ Both servers are starting..."
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop the servers
wait