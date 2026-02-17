#!/bin/bash

# Create data directory if it doesn't exist
mkdir -p ./data

# Set ownership to match the container user (UID 1001)
# This ensures the nextjs user in the container can write to the data folder
sudo chown -R 1001:1001 ./data

# Set appropriate permissions
chmod -R 755 ./data

echo "Data directory permissions set for Docker container user (UID 1001)"
echo "You can now run: docker-compose up --build"