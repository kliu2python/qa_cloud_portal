import React, { useState } from 'react';
import { Resource } from './EmulatorCloud';

interface SplitViewProps {
  resource: Resource;
  launchVNC: (port: number) => void;
  onGoBack: () => void;
}

const SplitView: React.FC<SplitViewProps> = ({ resource, launchVNC, onGoBack }) => {
  const [command, setCommand] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const handleCommandSubmit = async (cmd: string) => {
    if (!cmd.trim()) {
      setMessage('Command cannot be empty.');
      return;
    }

    try {
      const response = await fetch(`http://10.160.83.213:8309/dhub/emulator/adb/${resource.name}/${encodeURIComponent(cmd)}`, {
        method: 'POST',
      });

      if (response.ok) {
        if (cmd == '4') {
            cmd = "back to previous"
        }
        setMessage(`Command "${cmd}" executed successfully!`);
      } else {
        setMessage(`Failed to execute the command "${cmd}".`);
      }
    } catch (error) {
      console.error('Error sending command:', error);
      setMessage('An error occurred while sending the command.');
    } finally {
      if (cmd !== 'back') {
        setCommand(''); // Clear input field for normal commands
      }
    }
  };

  return (
    <div style={{ display: 'flex', height: '89vh' }}>
      {/* VNC View */}
      <div style={{ flex: 1, padding: '10px' }}>
        <iframe
          src={`http://10.160.24.88:${resource.vnc_port}/?password=fortinet`}
          width="100%"
          height="100%"
          style={{ border: 'none' }}
        ></iframe>
      </div>

      {/* Command Interface */}
      <div
        style={{
          width: '300px',
          padding: '10px',
          background: '#f7f7f7',
          borderLeft: '2px solid #ccc',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <button onClick={onGoBack} style={{ marginBottom: '10px' }}>
          Exist
        </button>

        <label htmlFor="command-input" style={{ marginBottom: '5px', fontWeight: 'bold' }}>
          Enter Text:
        </label>
        <input
          id="command-input"
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          style={{ marginBottom: '10px', padding: '5px', width: '100%' }}
        />

        <button onClick={() => handleCommandSubmit(command)} style={{ marginBottom: '10px', padding: '5px' }}>
          Enter
        </button>
        <button onClick={() => handleCommandSubmit('4')} style={{ marginBottom: '10px', padding: '5px' }}>
          Back
        </button>

        {message && (
          <div
            style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#e7f3fe',
              border: '1px solid #b3d4fc',
              borderRadius: '5px',
              color: '#3178c6',
            }}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default SplitView;
