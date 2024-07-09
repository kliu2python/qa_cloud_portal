import React, { useState } from 'react';
import './CustomModal.css';

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOSSubmit: (os: string) => void;
  onVersionSubmit: (os: string, version: string) => void;
  os: string | null;
}

const CustomModal: React.FC<CustomModalProps> = ({ isOpen, onClose, onOSSubmit, onVersionSubmit, os }) => {
  const [version, setVersion] = useState<string>('7');

  const handleOSSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedOS = (e.target as any).os.value;
    onOSSubmit(selectedOS);
  };

  const handleVersionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onVersionSubmit('android', version);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {os === null ? (
          <form onSubmit={handleOSSubmit}>
            <h2>Select OS</h2>
            <label>
              <input
                type="radio"
                name="os"
                value="android"
              />
              Android
            </label>
            <label>
              <input
                type="radio"
                name="os"
                value="ios"
              />
              iOS
            </label>
            <div className="modal-buttons">
              <button type="submit">Next</button>
              <button type="button" onClick={onClose}>Cancel</button>
            </div>
          </form>
        ) : os === 'android' ? (
          <form onSubmit={handleVersionSubmit}>
            <h2>Select Android Version</h2>
            <label>
              <select value={version} onChange={(e) => setVersion(e.target.value)}>
                {Array.from({ length: 14 - 7 + 1 }, (_, i) => i + 7).map((v) => (
                  <option key={v} value={v}>{`Android ${v}`}</option>
                ))}
              </select>
            </label>
            <div className="modal-buttons">
              <button type="submit">Create</button>
              <button type="button" onClick={onClose}>Cancel</button>
            </div>
          </form>
        ) : (
          <div>
            <h2>iOS Emulator</h2>
            <p>iOS emulator cloud is pending to be ready for use.</p>
            <div className="modal-buttons">
              <button type="button" onClick={onClose}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomModal;
