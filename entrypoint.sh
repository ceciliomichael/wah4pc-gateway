#!/bin/sh
set -e

# Fix permissions for data and log directories
# This ensures 'appuser' can write to the mounted volumes
chown -R appuser:appgroup /app/data
chown -R appuser:appgroup /app/log

# Execute the command as appuser
exec su-exec appuser "$@"