import React from 'react';

interface ResourceManageProps {
  nickName: string;
}

const ResourceManagement: React.FC<ResourceManageProps> = (
  nickName
) => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Welcome to the TaaS Cloud</h1>
      <p>Explore the Emulator Cloud and manage your resources effectively.</p>
    </div>
  );
};

export default ResourceManagement;