#!/usr/bin/env python3
"""
Browser Cloud Microservice
A Flask-based microservice for managing Selenium Grid with VNC support.
"""

import os
import yaml
import requests
import json
import logging
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_sock import Sock
from websocket import create_connection
from threading import Thread
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)  # Enable CORS for all routes
sock = Sock(app)

# Load configuration
def load_config():
    """Load configuration from config.yml and environment variables."""
    config_path = os.path.join(os.path.dirname(__file__), 'config.yml')
    config = {}

    # Load from YAML file if exists
    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f) or {}

    # Override with environment variables
    config['grid_url'] = os.environ.get('GRID_URL', config.get('grid_url', 'http://10.160.24.88:4444'))
    config['vnc_password'] = os.environ.get('VNC_PASSWORD', config.get('vnc_password', 'secret'))
    config['registration_secret'] = os.environ.get('REGISTRATION_SECRET', config.get('registration_secret', ''))
    config['host'] = os.environ.get('HOST', config.get('host', '0.0.0.0'))
    config['port'] = int(os.environ.get('PORT', config.get('port', 5000)))
    config['debug'] = os.environ.get('DEBUG', str(config.get('debug', False))).lower() == 'true'

    return config

CONFIG = load_config()
logger.info(f"Loaded configuration: grid_url={CONFIG['grid_url']}, port={CONFIG['port']}")

# Helper functions
def make_grid_request(endpoint, method='GET', data=None):
    """Make a request to the Selenium Grid API."""
    url = f"{CONFIG['grid_url']}{endpoint}"
    try:
        if method == 'GET':
            response = requests.get(url, timeout=10)
        elif method == 'POST':
            response = requests.post(url, json=data, timeout=10)
        elif method == 'DELETE':
            response = requests.delete(url, timeout=10)
        else:
            raise ValueError(f"Unsupported method: {method}")

        response.raise_for_status()
        return response.json() if response.text else {}
    except requests.RequestException as e:
        logger.error(f"Grid request failed: {method} {url} - {str(e)}")
        raise

def get_grid_status():
    """Get complete grid status including nodes and sessions."""
    try:
        status = make_grid_request('/status')
        return status
    except Exception as e:
        logger.error(f"Failed to get grid status: {str(e)}")
        return {
            'error': str(e),
            'ready': False,
            'message': 'Failed to connect to Selenium Grid'
        }

def get_sessions():
    """Get all active sessions."""
    try:
        status = get_grid_status()
        if 'error' in status:
            return []

        sessions = []
        nodes = status.get('value', {}).get('nodes', [])

        for node in nodes:
            for slot in node.get('slots', []):
                if slot.get('session'):
                    session_data = slot['session']
                    # Get VNC information from stereotype
                    stereotype = session_data.get('stereotype', {})
                    vnc_enabled = stereotype.get('se:vncEnabled', False)
                    vnc_port = stereotype.get('se:vncPort', 5900)

                    sessions.append({
                        'id': session_data.get('sessionId'),
                        'capabilities': session_data.get('capabilities', {}),
                        'stereotype': stereotype,
                        'startTime': session_data.get('start', ''),
                        'uri': session_data.get('uri', ''),
                        'nodeId': node.get('id'),
                        'nodeUri': node.get('uri'),
                        'vncEnabled': vnc_enabled,
                        'vncPort': vnc_port
                    })

        return sessions
    except Exception as e:
        logger.error(f"Failed to get sessions: {str(e)}")
        return []

# Web Dashboard Routes
@app.route('/')
def index():
    """Serve the web dashboard."""
    return send_from_directory('static', 'index.html')

# API Routes - Health & Config
@app.route('/api/v1/browser_cloud/health', methods=['GET'])
def health():
    """Health check endpoint."""
    try:
        status = get_grid_status()
        is_ready = status.get('value', {}).get('ready', False)

        return jsonify({
            'status': 'healthy' if is_ready else 'degraded',
            'grid_connected': 'error' not in status,
            'grid_ready': is_ready,
            'timestamp': time.time()
        }), 200 if is_ready else 503
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': time.time()
        }), 503

@app.route('/api/v1/browser_cloud/config', methods=['GET'])
def get_config():
    """Get current configuration (excluding sensitive data)."""
    return jsonify({
        'grid_url': CONFIG['grid_url'],
        'host': CONFIG['host'],
        'port': CONFIG['port'],
        'debug': CONFIG['debug']
    })

# API Routes - Grid Status
@app.route('/api/v1/browser_cloud/status', methods=['GET'])
def status():
    """Get complete grid status with nodes and sessions."""
    try:
        grid_status = get_grid_status()

        if 'error' in grid_status:
            return jsonify(grid_status), 503

        # Calculate statistics
        value = grid_status.get('value', {})
        nodes = value.get('nodes', [])

        total_slots = 0
        available_slots = 0
        active_sessions = 0

        for node in nodes:
            slots = node.get('slots', [])
            total_slots += len(slots)
            for slot in slots:
                if slot.get('session'):
                    active_sessions += 1
                else:
                    available_slots += 1

        return jsonify({
            'ready': value.get('ready', False),
            'message': value.get('message', ''),
            'nodes': nodes,
            'sessions': get_sessions(),
            'statistics': {
                'total_nodes': len(nodes),
                'total_slots': total_slots,
                'available_slots': available_slots,
                'active_sessions': active_sessions
            }
        })
    except Exception as e:
        logger.error(f"Status endpoint failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

# API Routes - Session Management
@app.route('/api/v1/browser_cloud/sessions', methods=['GET'])
def list_sessions():
    """Get all active sessions."""
    try:
        sessions = get_sessions()
        return jsonify({
            'sessions': sessions,
            'count': len(sessions)
        })
    except Exception as e:
        logger.error(f"List sessions failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/browser_cloud/session', methods=['POST'])
def create_session():
    """Create a new browser session."""
    try:
        data = request.get_json()

        if not data or 'desiredCapabilities' not in data:
            return jsonify({'error': 'desiredCapabilities required'}), 400

        capabilities = data['desiredCapabilities']

        # Create session via WebDriver protocol
        response = make_grid_request(
            '/session',
            method='POST',
            data={'desiredCapabilities': capabilities}
        )

        return jsonify(response), 201
    except Exception as e:
        logger.error(f"Create session failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/browser_cloud/session/<session_id>', methods=['GET'])
def get_session(session_id):
    """Get details of a specific session."""
    try:
        sessions = get_sessions()
        session = next((s for s in sessions if s['id'] == session_id), None)

        if not session:
            return jsonify({'error': 'Session not found'}), 404

        return jsonify(session)
    except Exception as e:
        logger.error(f"Get session failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/browser_cloud/session/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    """Delete a browser session."""
    try:
        # Delete session via WebDriver protocol
        make_grid_request(f'/session/{session_id}', method='DELETE')

        return jsonify({
            'message': f'Session {session_id} deleted successfully'
        })
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            return jsonify({'error': 'Session not found'}), 404
        raise
    except Exception as e:
        logger.error(f"Delete session failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

# API Routes - Node Management
@app.route('/api/v1/browser_cloud/node/<node_id>', methods=['GET'])
def get_node(node_id):
    """Get information about a specific node."""
    try:
        status = get_grid_status()
        nodes = status.get('value', {}).get('nodes', [])
        node = next((n for n in nodes if n.get('id') == node_id), None)

        if not node:
            return jsonify({'error': 'Node not found'}), 404

        return jsonify(node)
    except Exception as e:
        logger.error(f"Get node failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/browser_cloud/node/<node_id>', methods=['DELETE'])
def delete_node(node_id):
    """Remove a node from the grid."""
    try:
        # Call Grid's node removal endpoint
        make_grid_request(f'/se/grid/distributor/node/{node_id}', method='DELETE')

        return jsonify({
            'message': f'Node {node_id} removed successfully'
        })
    except Exception as e:
        logger.error(f"Delete node failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/browser_cloud/node/<node_id>/drain', methods=['POST'])
def drain_node(node_id):
    """Drain a node (prevent new sessions, allow existing to complete)."""
    try:
        # Call Grid's node drain endpoint
        make_grid_request(f'/se/grid/distributor/node/{node_id}/drain', method='POST')

        return jsonify({
            'message': f'Node {node_id} is being drained'
        })
    except Exception as e:
        logger.error(f"Drain node failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

# API Routes - Queue Management
@app.route('/api/v1/browser_cloud/queue', methods=['GET'])
def get_queue():
    """Get the session request queue."""
    try:
        queue_status = make_grid_request('/se/grid/newsessionqueue/queue')

        return jsonify({
            'queue': queue_status.get('value', []),
            'size': len(queue_status.get('value', []))
        })
    except Exception as e:
        logger.error(f"Get queue failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/browser_cloud/queue', methods=['DELETE'])
def clear_queue():
    """Clear the session request queue."""
    try:
        make_grid_request('/se/grid/newsessionqueue/queue', method='DELETE')

        return jsonify({
            'message': 'Queue cleared successfully'
        })
    except Exception as e:
        logger.error(f"Clear queue failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

# WebSocket Routes - VNC Proxy
@sock.route('/vnc/<session_id>')
def vnc_proxy(ws, session_id):
    """WebSocket proxy for VNC connection to a browser session."""
    try:
        # Get session info to find the node and VNC port
        sessions = get_sessions()
        session = next((s for s in sessions if s['id'] == session_id), None)

        if not session:
            ws.send(json.dumps({'error': 'Session not found'}))
            return

        if not session.get('vncEnabled'):
            ws.send(json.dumps({'error': 'VNC not enabled for this session'}))
            return

        # Extract VNC connection details
        node_uri = session.get('nodeUri', '')
        vnc_port = session.get('vncPort', 5900)

        # Parse node host from URI
        if '://' in node_uri:
            node_host = node_uri.split('://')[1].split(':')[0]
        else:
            node_host = node_uri.split(':')[0]

        vnc_url = f"ws://{node_host}:{vnc_port}"

        logger.info(f"Connecting to VNC: {vnc_url} for session {session_id}")

        # Create WebSocket connection to VNC server
        vnc_ws = create_connection(vnc_url)

        def forward_to_vnc():
            """Forward messages from client to VNC server."""
            try:
                while True:
                    data = ws.receive()
                    if data is None:
                        break
                    vnc_ws.send(data, opcode=0x2)  # Binary frame
            except Exception as e:
                logger.error(f"Error forwarding to VNC: {str(e)}")
            finally:
                vnc_ws.close()

        def forward_to_client():
            """Forward messages from VNC server to client."""
            try:
                while True:
                    data = vnc_ws.recv()
                    if not data:
                        break
                    ws.send(data)
            except Exception as e:
                logger.error(f"Error forwarding to client: {str(e)}")
            finally:
                ws.close()

        # Start forwarding threads
        Thread(target=forward_to_vnc, daemon=True).start()
        forward_to_client()

    except Exception as e:
        logger.error(f"VNC proxy error: {str(e)}")
        try:
            ws.send(json.dumps({'error': str(e)}))
        except:
            pass

# Compatibility endpoints for React frontend
@app.route('/api/status', methods=['GET'])
def compat_status():
    """
    Compatibility endpoint for React frontend.
    Returns data in the format expected by BrowserCloud.tsx
    """
    try:
        grid_status = get_grid_status()

        if 'error' in grid_status:
            return jsonify({
                'success': False,
                'error': grid_status.get('error', 'Failed to connect to grid')
            }), 503

        # Calculate statistics
        value = grid_status.get('value', {})
        nodes = value.get('nodes', [])

        total_slots = 0
        available_slots = 0
        active_sessions = 0

        # Transform nodes to match GridNode interface
        transformed_nodes = []
        for node in nodes:
            slots = node.get('slots', [])
            total_slots += len(slots)

            # Transform slots
            transformed_slots = []
            for slot in slots:
                session_data = slot.get('session')
                if session_data:
                    active_sessions += 1
                    # Transform session to match Session interface
                    transformed_session = {
                        'sessionId': session_data.get('sessionId'),
                        'capabilities': session_data.get('capabilities', {}),
                        'startTime': session_data.get('start', ''),
                        'uri': session_data.get('uri', '')
                    }
                else:
                    available_slots += 1
                    transformed_session = None

                transformed_slots.append({
                    'id': slot.get('id', ''),
                    'stereotype': slot.get('stereotype', {}),
                    'session': transformed_session
                })

            transformed_nodes.append({
                'id': node.get('id', ''),
                'uri': node.get('uri', ''),
                'availability': node.get('availability', 'UNKNOWN'),
                'slots': transformed_slots
            })

        # Get active sessions in the format expected by frontend
        sessions_list = []
        for node in nodes:
            for slot in node.get('slots', []):
                if slot.get('session'):
                    session_data = slot['session']
                    sessions_list.append({
                        'sessionId': session_data.get('sessionId'),
                        'nodeId': node.get('id'),
                        'nodeUri': node.get('uri'),
                        'capabilities': session_data.get('capabilities', {}),
                        'startTime': session_data.get('start', ''),
                        'stereotype': session_data.get('stereotype', {})
                    })

        return jsonify({
            'success': True,
            'data': {
                'nodes': transformed_nodes,
                'sessions': sessions_list,
                'statistics': {
                    'totalNodes': len(nodes),
                    'totalSlots': total_slots,
                    'availableSlots': available_slots,
                    'activeSessions': active_sessions
                },
                'gridUrl': CONFIG['grid_url'],
                'vncPassword': CONFIG['vnc_password']
            }
        })
    except Exception as e:
        logger.error(f"Compatibility status endpoint failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/session/<session_id>', methods=['DELETE'])
def compat_delete_session(session_id):
    """
    Compatibility endpoint for React frontend.
    Delete a browser session.
    """
    try:
        # Delete session via WebDriver protocol
        make_grid_request(f'/session/{session_id}', method='DELETE')

        return jsonify({
            'success': True,
            'message': f'Session {session_id} deleted successfully'
        })
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            return jsonify({
                'success': False,
                'error': 'Session not found'
            }), 404
        raise
    except Exception as e:
        logger.error(f"Compatibility delete session failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    logger.error(f"Internal error: {str(error)}")
    return jsonify({'error': 'Internal server error'}), 500

# Main entry point
if __name__ == '__main__':
    logger.info(f"Starting Browser Cloud Microservice on {CONFIG['host']}:{CONFIG['port']}")
    logger.info(f"Selenium Grid URL: {CONFIG['grid_url']}")

    app.run(
        host=CONFIG['host'],
        port=CONFIG['port'],
        debug=CONFIG['debug']
    )
