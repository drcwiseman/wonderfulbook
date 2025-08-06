#!/bin/bash

# Production Database Sync Script
# Replace PRODUCTION_DATABASE_URL with your actual production database URL

echo "Starting production database sync..."

# Check if production URL is provided
if [ -z "$1" ]; then
    echo "Usage: ./run-production-sync.sh PRODUCTION_DATABASE_URL"
    echo "Example: ./run-production-sync.sh postgresql://user:pass@host:port/database"
    exit 1
fi

PRODUCTION_URL="$1"

echo "Step 1: Syncing schema..."
psql "$PRODUCTION_URL" < production-database-sync.sql

if [ $? -eq 0 ]; then
    echo "✓ Schema sync completed successfully"
    
    echo "Step 2: Importing development data..."
    psql "$PRODUCTION_URL" < development-data-only.sql
    
    if [ $? -eq 0 ]; then
        echo "✓ Data import completed successfully"
        echo "🎉 Production database sync completed!"
        echo "Your site should now deploy correctly with all features working."
    else
        echo "❌ Data import failed"
        exit 1
    fi
else
    echo "❌ Schema sync failed"
    exit 1
fi