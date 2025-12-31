#!/bin/sh

if [ "$DEBUG" = "False" ]; then
    echo "Waiting for postgres..."
    while ! nc -z $POSTGRES_SERVER $POSTGRES_PORT; do
      sleep 0.1
    done
    echo "PostgreSQL started"
fi

if [ "$DEBUG" = "True" ]; then
    echo "Running in DEBUG mode"
    exec uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
else
    echo "Running in PRODUCTION mode"
    exec uvicorn backend.main:app --host 0.0.0.0 --port 8000
fi
