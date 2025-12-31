#!/bin/sh

if [ "$DEBUG" = "False" ]; then
    echo "Waiting for postgres..."
    while ! nc -z $POSTGRES_SERVER $POSTGRES_PORT; do
      sleep 0.1
    done
    echo "PostgreSQL started"
fi

exec uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
