#!/bin/bash
# Script to run Browser Cloud API locally for development

# Set environment variables for local development
export GRID_URL=${GRID_URL:-"http://10.160.24.88:4444"}
export VNC_PASSWORD=${VNC_PASSWORD:-"secret"}
export REGISTRATION_SECRET=${REGISTRATION_SECRET:-""}
export HOST=${HOST:-"0.0.0.0"}
export PORT=${PORT:-31590}
export DEBUG=${DEBUG:-true}

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Run the Flask app
echo "Starting Browser Cloud API on http://$HOST:$PORT"
echo "Connecting to Selenium Grid at $GRID_URL"
python3 api.py
