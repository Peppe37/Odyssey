#!/bin/sh

# Database is already healthy due to depends_on condition in docker-compose
# No need to wait for postgres manually

if [ "$DEBUG" = "True" ]; then
    echo "Running in DEBUG mode"
    exec uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
else
    echo "Running in PRODUCTION mode"
    exec uvicorn backend.main:app --host 0.0.0.0 --port 8000
fi
