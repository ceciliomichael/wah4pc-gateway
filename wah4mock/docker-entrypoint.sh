#!/bin/sh
set -e

# Fix permissions for data directory
if [ -d "/app/data" ]; then
    echo "Fixing permissions for /app/data..."
    chown -R nextjs:nodejs /app/data
fi

# Execute the command as nextjs user
exec su-exec nextjs "$@"