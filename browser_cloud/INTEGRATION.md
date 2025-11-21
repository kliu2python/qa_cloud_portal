# Browser Cloud Integration Guide

This guide explains how to integrate the Browser Cloud microservice with your main Flask application.

## Quick Integration

### Option 1: As a Flask Blueprint (Recommended)

In your main `app.py`, add the following:

```python
from flask import Flask
from flask_cors import CORS
from browser_cloud import register_routes as register_browser_cloud

# Create Flask app
app = Flask(__name__)
CORS(app)

# Register browser_cloud routes
register_browser_cloud(app)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
```

### Option 2: Dynamic Feature Loading

If you have a dynamic feature loading system:

```python
from flask import Flask
from flask_cors import CORS
import importlib

app = Flask(__name__)
CORS(app)

# Load features dynamically
features = ['browser_cloud', 'jenkins_cloud', 'emulator_cloud']

for feature_name in features:
    try:
        feature_module = importlib.import_module(feature_name)
        if hasattr(feature_module, 'register_routes'):
            feature_module.register_routes(app)
            print(f"✓ Loaded feature: {feature_name}")
        else:
            print(f"✗ Feature {feature_name} missing register_routes() function")
    except ImportError as e:
        print(f"✗ Failed to load feature {feature_name}: {e}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
```

### Option 3: Configuration-Based Loading

If you use a configuration file for features:

```python
# features.yml
features:
  - name: browser_cloud
    enabled: true
    module: browser_cloud
  - name: jenkins_cloud
    enabled: true
    module: jenkins_cloud
```

```python
# app.py
from flask import Flask
from flask_cors import CORS
import yaml
import importlib

app = Flask(__name__)
CORS(app)

# Load features from config
with open('features.yml', 'r') as f:
    config = yaml.safe_load(f)

for feature_config in config.get('features', []):
    if not feature_config.get('enabled', False):
        continue

    feature_name = feature_config['name']
    module_name = feature_config['module']

    try:
        feature_module = importlib.import_module(module_name)
        if hasattr(feature_module, 'register_routes'):
            feature_module.register_routes(app)
            print(f"Loading Feature: {feature_name}")
        else:
            print(f"Warning: Feature {feature_name} missing register_routes()")
    except Exception as e:
        print(f"Error loading {feature_name}: {e}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
```

## Registered Routes

Once integrated, the following routes will be available:

### Grid Status & Health
- `GET /api/status` - **Compatibility endpoint for React frontend**
- `GET /api/v1/browser_cloud/status` - Detailed grid status
- `GET /api/v1/browser_cloud/health` - Health check
- `GET /api/v1/browser_cloud/config` - Configuration info

### Session Management
- `GET /api/v1/browser_cloud/sessions` - List all sessions
- `POST /api/v1/browser_cloud/session` - Create new session
- `GET /api/v1/browser_cloud/session/<id>` - Get session details
- `DELETE /api/v1/browser_cloud/session/<id>` - Delete session
- `DELETE /api/session/<id>` - **Compatibility endpoint for React frontend**

### Node Management
- `GET /api/v1/browser_cloud/node/<id>` - Get node info
- `DELETE /api/v1/browser_cloud/node/<id>` - Remove node
- `POST /api/v1/browser_cloud/node/<id>/drain` - Drain node

### Queue Management
- `GET /api/v1/browser_cloud/queue` - Get session queue
- `DELETE /api/v1/browser_cloud/queue` - Clear queue

### WebSocket
- `WS /vnc/<session_id>` - VNC WebSocket proxy

## Configuration

Browser Cloud loads configuration from:
1. `browser_cloud/config.yml` file
2. Environment variables (override YAML)

Available settings:
- `GRID_URL` - Selenium Grid URL (default: http://10.160.24.88:4444)
- `VNC_PASSWORD` - VNC password (default: secret)
- `REGISTRATION_SECRET` - Grid registration secret
- `HOST` - Server host (default: 0.0.0.0)
- `PORT` - Server port (default: 8080)
- `DEBUG` - Debug mode (default: false)

## Testing the Integration

After starting your main app, test the endpoints:

```bash
# Test health endpoint
curl http://localhost:8080/api/v1/browser_cloud/health

# Test compatibility endpoint (used by React frontend)
curl http://localhost:8080/api/status

# Test grid status
curl http://localhost:8080/api/v1/browser_cloud/status
```

You should see JSON responses if the integration is successful.

## Troubleshooting

### Routes Not Found (404 errors)

If you're getting 404 errors for `/api/status`:

1. **Check that register_routes() is being called**:
   ```python
   # Add debug logging
   from browser_cloud import register_routes as register_browser_cloud
   print("Registering browser_cloud routes...")
   register_browser_cloud(app)
   print("✓ Browser cloud routes registered")
   ```

2. **Verify the routes are registered**:
   ```python
   # After calling register_routes(), print all routes
   print("\nRegistered routes:")
   for rule in app.url_map.iter_rules():
       print(f"  {rule.methods} {rule.rule}")
   ```

3. **Check import path**: Make sure `browser_cloud` is in your Python path:
   ```python
   import sys
   sys.path.insert(0, '/path/to/qa_cloud_portal')
   from browser_cloud import register_routes
   ```

### Module Import Errors

If you get `ModuleNotFoundError`:

```python
# Add the project directory to Python path
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
```

### Flask-Sock Not Installed

If you get errors about Flask-Sock:

```bash
pip install Flask-Sock websocket-client
```

## Dependencies

Browser Cloud requires:
- Flask >= 3.0.0
- Flask-Cors >= 4.0.0
- Flask-Sock >= 0.7.0
- PyYAML >= 6.0.1
- requests >= 2.31.0
- websocket-client >= 1.7.0

Install all dependencies:
```bash
pip install -r dockerfiles/browser_cloud/api/requirements.txt
```
