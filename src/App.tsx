import React, { useState, useEffect } from 'react';
import NickNamePage from './nickname';
import ResourcePage from './resources';
import CustomModal from './CustomModal';
import LoadingModal from './LoadingModal';

interface Resource {
  adb_port: number;
  available: string;
  name: string;
  status: string;
  version: string;
  vnc_port: number;
}

const App: React.FC = () => {
  const [nickname, setNickname] = useState<string>('');
  const [resources, setResources] = useState<Resource[]>([]);
  const [rememberNickname, setRememberNickname] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1); // State to manage page navigation
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false); // New state for loading
  const [os, setOS] = useState<string | null>(null);

  useEffect(() => {
    const storedNickname = localStorage.getItem('nickname');
    if (storedNickname) {
      setNickname(storedNickname);
      fetchResources(storedNickname);
    }
  }, []);

  const handleNicknameSubmit = (nickname: string) => {
    setNickname(nickname);
    if (rememberNickname) {
      localStorage.setItem('nickname', nickname);
    } else {
      localStorage.removeItem('nickname');
    }
    setPage(2);
    fetchResources(nickname);
  };

  const resetNickname = () => {
    localStorage.removeItem('nickname');
    handleRefresh();
  };

  const fetchResources = async (nickname: string) => {
    setLoading(true); // Show loading modal
    try {
      const response = await fetch(`http://10.160.83.213:8309/dhub/emulator/list/${nickname}`, {
        method: 'GET'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch resources');
      }
      const data = await response.json();
      setResources(data.results || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false); // Hide loading modal
    }
  };

  const handleCreateNew = () => {
    setOS(null);
    setModalIsOpen(true);
  };

  const createEmulator = async (os: string, version: string) => {
    setLoading(true); // Show loading modal
    try {
      const response = await fetch('http://10.160.83.213:8309/dhub/emulator/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ os, version, creator: nickname })
      });
      if (!response.ok) {
        throw new Error('Failed to create emulator');
      }
      // Refresh resources after creation
      fetchResources(nickname);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false); // Hide loading modal
    }
  };

  const deleteResource = async (name: string, nickName: string) => {
    setLoading(true); // Show loading modal
    try {
      const response = await fetch('http://10.160.83.213:8309/dhub/emulator/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pod_name: name, creator: nickName })
      });
      if (!response.ok) {
        throw new Error('Failed to delete resource');
      }
      // Refresh resources after deletion
      fetchResources(nickname);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false); // Hide loading modal
    }
  };

  const launchVNC = (port: number) => {
    window.open(`http://10.160.24.17:${port}/?password=fortinet`, '_blank');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleOSSubmit = (selectedOS: string) => {
    setOS(selectedOS);
  };

  const handleVersionSubmit = (os: string, version: string) => {
    createEmulator(os, version);
  };

  const checkResourceStatus = async (name: string) => {
    try {
      const response = await fetch(`http://10.160.83.213:8309/dhub/emulator/check/${name}`, {
        method: 'GET'
      });
      if (!response.ok) {
        throw new Error('Failed to check resource status');
      }
      const data = await response.json();
      return data.results.status;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const updateResourceStatus = (name: string, status: string) => {
    setResources(prevResources =>
      prevResources.map(resource =>
        resource.name === name ? { ...resource, status } : resource
      )
    );
  };

  return (
    <div>
      {nickname ? (
        <ResourcePage
          resources={resources}
          createResource={createEmulator}
          deleteResource={deleteResource}
          launchVNC={launchVNC}
          refreshPage={handleRefresh}
          nickName={nickname}
          resetNickname={resetNickname}
          handleCreateNew={handleCreateNew}
          checkResourceStatus={checkResourceStatus} // Pass the checkResourceStatus function
          updateResourceStatus={updateResourceStatus} // Pass the updateResourceStatus function
        />
      ) : (
        <NickNamePage onSubmit={handleNicknameSubmit} />
      )}
      <CustomModal
        isOpen={modalIsOpen}
        onClose={() => setModalIsOpen(false)}
        onOSSubmit={handleOSSubmit}
        onVersionSubmit={handleVersionSubmit}
        os={os}
      />
      <LoadingModal isOpen={loading} /> {/* Add the LoadingModal component */}
    </div>
  );
};

export default App;
