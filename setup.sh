#!/bin/bash

# Fastify-HylaFax Gateway Setup Script

# Function to print colored messages
print_message() {
  echo -e "\e[1;34m$1\e[0m"
}

print_error() {
  echo -e "\e[1;31m$1\e[0m"
}

print_success() {
  echo -e "\e[1;32m$1\e[0m"
}

# Check if HylaFax client is installed
check_hylafax() {
  print_message "Checking for HylaFax client..."
  if command -v sendfax &> /dev/null; then
    print_success "HylaFax client found!"
  else
    print_error "HylaFax client not found."
    print_message "Installing HylaFax client..."
    
    # Detect OS
    if [ -f /etc/debian_version ]; then
      # Debian/Ubuntu
      sudo apt-get update
      sudo apt-get install -y hylafax-client
    elif [ -f /etc/redhat-release ]; then
      # CentOS/RHEL
      sudo yum install -y hylafax-client
    elif [ -f /etc/alpine-release ]; then
      # Alpine
      sudo apk add --no-cache hylafax-client
    elif command -v brew &> /dev/null; then
      # macOS with Homebrew
      brew install hylafax
    else
      print_error "Unable to determine your OS. Please install HylaFax client manually."
      return 1
    fi
    
    if [ $? -eq 0 ]; then
      print_success "HylaFax client installed successfully!"
    else
      print_error "Failed to install HylaFax client."
      print_message "Please install HylaFax client manually and try again."
      return 1
    fi
  fi
}

# Install Node.js dependencies
install_dependencies() {
  print_message "Installing Node.js dependencies..."
  npm install
  
  if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully!"
  else
    print_error "Failed to install dependencies."
    return 1
  fi
}

# Set up configuration file
setup_config() {
  print_message "Setting up configuration..."
  
  if [ ! -f .env ]; then
    cp src/.env.example .env
    print_success "Created .env file from template."
  else
    print_message ".env file already exists. Skipping."
  fi
  
  print_message "Please edit the .env file with your HylaFax server details:"
  print_message "  - HYLAFAX_HOST"
  print_message "  - HYLAFAX_USER"
  print_message "  - HYLAFAX_PASSWORD"
  print_message "  - API_KEYS (comma-separated list)"
}

# Create data directory
create_data_dir() {
  print_message "Creating data directory..."
  mkdir -p data
  chmod 755 data
  print_success "Data directory created."
}

# Main setup process
main() {
  print_message "==============================================="
  print_message "   Fastify-HylaFax Gateway Setup              "
  print_message "==============================================="
  
  check_hylafax || return 1
  install_dependencies || return 1
  create_data_dir || return 1
  setup_config || return 1
  
  print_message "==============================================="
  print_success "Setup complete!"
  print_message "You can now start the server with: npm start"
  print_message "Or using Docker: docker-compose up -d"
  print_message "==============================================="
}

# Run the main function
main
