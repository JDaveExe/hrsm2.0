#!/bin/bash

# HRSM 2.0 - Automated Setup Script
# This script helps automate the setup process for new developers

echo "🏥 HRSM 2.0 - Automated Setup Script"
echo "===================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Node.js is installed
echo "Checking prerequisites..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js v16 or higher."
    echo "Download from: https://nodejs.org/"
    exit 1
else
    NODE_VERSION=$(node --version)
    print_status "Node.js is installed: $NODE_VERSION"
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
else
    NPM_VERSION=$(npm --version)
    print_status "npm is installed: $NPM_VERSION"
fi

# Check if MySQL is running (optional check)
if command -v mysql &> /dev/null; then
    print_status "MySQL is installed"
else
    print_warning "MySQL not found in PATH. Make sure MySQL is installed and running."
fi

echo ""
echo "🔧 Starting setup process..."
echo ""

# Install frontend dependencies
print_info "Installing frontend dependencies..."
if npm install; then
    print_status "Frontend dependencies installed successfully"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

echo ""

# Install backend dependencies
print_info "Installing backend dependencies..."
cd backend
if npm install; then
    print_status "Backend dependencies installed successfully"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi

cd ..

echo ""

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    print_warning ".env file not found. Creating from template..."
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        print_status "Created .env file from template"
        print_warning "⚠️  IMPORTANT: Please edit backend/.env with your database credentials!"
        print_info "Required settings:"
        echo "  - DB_USER=your_mysql_username"
        echo "  - DB_PASSWORD=your_mysql_password"
        echo "  - JWT_SECRET=your-64-character-secret-key"
        echo "  - DEFAULT_ADMIN_PASSWORD=your_secure_password"
        echo "  - DEFAULT_DOCTOR_PASSWORD=your_secure_password"
        echo "  - DEFAULT_PATIENT_PASSWORD=your_secure_password"
        echo ""
    else
        print_error ".env.example file not found!"
        exit 1
    fi
else
    print_status ".env file already exists"
fi

echo ""
print_status "Setup completed successfully! 🎉"
echo ""
print_info "Next steps:"
echo "1. Configure your database settings in backend/.env"
echo "2. Create MySQL database: CREATE DATABASE hrsm_db;"
echo "3. Run database setup: node backend/scripts/setupDatabase.js"
echo "4. Start backend: cd backend && npm start"
echo "5. Start frontend: npm start (in new terminal)"
echo ""
print_info "For detailed instructions, see QUICK_START_GUIDE.md"
echo ""
print_status "Happy coding! 🚀"
