import React from 'react';
import { Link } from 'react-router-dom';

const NavigateBar: React.FC = () => {
  return (
    <div
      className="bg-dark text-white d-flex flex-column justify-content-between p-3"
      style={{ width: '250px', minHeight: '100vh' }}
    >
      {/* Header */}
      <div>
        <h3 className="text-center mb-4">TaaS Cloud</h3>
        <Link to="/" className="btn btn-outline-light d-block mb-3">
          Home
        </Link>
        <Link to="/emulator-cloud" className="btn btn-outline-light d-block mb-3">
          Emulator Cloud
        </Link>
        <Link to="/browser-cloud" className="btn btn-outline-light d-block mb-3">
          Browser Cloud
        </Link>
        <Link to="/resource" className="btn btn-outline-light d-block mb-3">
          Resource Dashboard
        </Link>
      </div>

      {/* Footer */}
      <div className="text-center mt-4">
        <hr className="border-light" />
        <p className="mb-1">Version: 1.0.0</p>
        <p className="mb-0">Editor: Jiahao Liu (ljiahao@fortinet.com)</p>
      </div>
    </div>
  );
};

export default NavigateBar;
