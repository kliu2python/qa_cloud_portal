"""
Browser Cloud Microservice - Blueprint Integration
Provides browser testing infrastructure management via Selenium Grid
"""

from flask import Blueprint, jsonify, request, send_from_directory
from flask_sock import Sock
import requests
import json
import logging
import yaml
import os
from websocket import create_connection
from threading import Thread
import time

# Configure logging
logger = logging.getLogger(__name__)

# Create Blueprint
browser_cloud_bp = Blueprint('browser_cloud', __name__,
                             static_folder='static',
                             static_url_path='/browser_cloud/static')

# Module-level sock instance (will be initialized by register_routes)
sock = None

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
    config['port'] = int(os.environ.get('PORT', config.get('port', 8080)))
    config['debug'] = os.environ.get('DEBUG', str(config.get('debug', False))).lower() == 'true'

    return config

CONFIG = load_config()
logger.info(f"[Browser Cloud] Loaded configuration: grid_url={CONFIG['grid_url']}")

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

# ==========================================
#  BLUEPRINT ROUTES
# ==========================================

# Web Dashboard Routes
@browser_cloud_bp.route('/')
def index():
    """Serve the web dashboard."""
    return send_from_directory(browser_cloud_bp.static_folder, 'index.html')

# API Routes - Health & Config
@browser_cloud_bp.route('/api/v1/browser_cloud/health', methods=['GET'])
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

@browser_cloud_bp.route('/api/v1/browser_cloud/config', methods=['GET'])
def get_config():
    """Get current configuration (excluding sensitive data)."""
    return jsonify({
        'grid_url': CONFIG['grid_url'],
        'host': CONFIG['host'],
        'port': CONFIG['port'],
        'debug': CONFIG['debug']
    })

# API Routes - Grid Status
@browser_cloud_bp.route('/api/v1/browser_cloud/status', methods=['GET'])
def status():
    """Get complete grid status with nodes and sessions."""
    try:
        grid_status = get_grid_status()

        if 'error' in grid_status:
            return jsonify(grid_status), 503

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

# Compatibility endpoint for React frontend
@browser_cloud_bp.route('/api/status', methods=['GET'])
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

        value = grid_status.get('value', {})
        nodes = value.get('nodes', [])

        total_slots = 0
        available_slots = 0
        active_sessions = 0

        transformed_nodes = []
        for node in nodes:
            slots = node.get('slots', [])
            total_slots += len(slots)

            transformed_slots = []
            for slot in slots:
                session_data = slot.get('session')
                if session_data:
                    active_sessions += 1
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

# API Routes - Session Management
@browser_cloud_bp.route('/api/v1/browser_cloud/sessions', methods=['GET'])
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

@browser_cloud_bp.route('/api/v1/browser_cloud/session', methods=['POST'])
def create_session():
    """Create a new browser session."""
    try:
        data = request.get_json()

        if not data or 'desiredCapabilities' not in data:
            return jsonify({'error': 'desiredCapabilities required'}), 400

        capabilities = data['desiredCapabilities']

        response = make_grid_request(
            '/session',
            method='POST',
            data={'desiredCapabilities': capabilities}
        )

        return jsonify(response), 201
    except Exception as e:
        logger.error(f"Create session failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

@browser_cloud_bp.route('/api/v1/browser_cloud/session/<session_id>', methods=['GET'])
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

@browser_cloud_bp.route('/api/v1/browser_cloud/session/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    """Delete a browser session."""
    try:
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

# Compatibility endpoint
@browser_cloud_bp.route('/api/session/<session_id>', methods=['DELETE'])
def compat_delete_session(session_id):
    """Compatibility endpoint for React frontend."""
    try:
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

# API Routes - Node Management
@browser_cloud_bp.route('/api/v1/browser_cloud/node/<node_id>', methods=['GET'])
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

@browser_cloud_bp.route('/api/v1/browser_cloud/node/<node_id>', methods=['DELETE'])
def delete_node(node_id):
    """Remove a node from the grid."""
    try:
        make_grid_request(f'/se/grid/distributor/node/{node_id}', method='DELETE')

        return jsonify({
            'message': f'Node {node_id} removed successfully'
        })
    except Exception as e:
        logger.error(f"Delete node failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

@browser_cloud_bp.route('/api/v1/browser_cloud/node/<node_id>/drain', methods=['POST'])
def drain_node(node_id):
    """Drain a node (prevent new sessions, allow existing to complete)."""
    try:
        make_grid_request(f'/se/grid/distributor/node/{node_id}/drain', method='POST')

        return jsonify({
            'message': f'Node {node_id} is being drained'
        })
    except Exception as e:
        logger.error(f"Drain node failed: {str(e)}")
        return jsonify({'error': str(e)}), 500

# API Routes - Queue Management
@browser_cloud_bp.route('/api/v1/browser_cloud/queue', methods=['GET'])
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

@browser_cloud_bp.route('/api/v1/browser_cloud/queue', methods=['DELETE'])
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


# ==========================================
#  REGISTRATION FUNCTION
# ==========================================

def register_routes(app):
    """
    Register the browser_cloud blueprint with the Flask app.

    Args:
        app: Flask application instance
    """
    global sock

    # Initialize Flask-Sock with the main app if not already done
    if not hasattr(app, 'sock'):
        sock = Sock(app)
    else:
        sock = app.sock

    # Register the WebSocket route
    @sock.route('/vnc/<session_id>')
    def vnc_proxy(ws, session_id):
        """WebSocket proxy for VNC connection to a browser session."""
        try:
            sessions = get_sessions()
            session = next((s for s in sessions if s['id'] == session_id), None)

            if not session:
                ws.send(json.dumps({'error': 'Session not found'}))
                return

            if not session.get('vncEnabled'):
                ws.send(json.dumps({'error': 'VNC not enabled for this session'}))
                return

            node_uri = session.get('nodeUri', '')
            vnc_port = session.get('vncPort', 5900)

            if '://' in node_uri:
                node_host = node_uri.split('://')[1].split(':')[0]
            else:
                node_host = node_uri.split(':')[0]

            vnc_url = f"ws://{node_host}:{vnc_port}"

            logger.info(f"Connecting to VNC: {vnc_url} for session {session_id}")

            vnc_ws = create_connection(vnc_url)

            def forward_to_vnc():
                try:
                    while True:
                        data = ws.receive()
                        if data is None:
                            break
                        vnc_ws.send(data, opcode=0x2)
                except Exception as e:
                    logger.error(f"Error forwarding to VNC: {str(e)}")
                finally:
                    vnc_ws.close()

            def forward_to_client():
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

            Thread(target=forward_to_vnc, daemon=True).start()
            forward_to_client()

        except Exception as e:
            logger.error(f"VNC proxy error: {str(e)}")
            try:
                ws.send(json.dumps({'error': str(e)}))
            except:
                pass

    # Register the blueprint
    app.register_blueprint(browser_cloud_bp)
    logger.info("[Browser Cloud] Routes registered successfully")
