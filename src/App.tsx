import React, { useState, useEffect } from 'react';
import NickNamePage from './nickname';
import ResourcePage from './resources';

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
  const [os, setOS] = useState<string>('android');
  const [version, setVersion] = useState<string>('14');

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
    handleRefresh()
  };

  const fetchResources = async (nickname: string) => {
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
    }
  };

  const handleCreateNew = () => {
    const selectedOS = window.prompt('Select OS (android or ios):');
    if (selectedOS) {
      setOS(selectedOS);
      if (selectedOS === 'android') {
        const selectedVersion = window.prompt('Select Android version (7 to 14):');
        if (selectedVersion && parseInt(selectedVersion) >= 7 && parseInt(selectedVersion) <= 14) {
          setVersion(selectedVersion);
          createEmulator(selectedOS, selectedVersion);
        } else {
          alert('Please enter a valid Android version between 7 and 14.');
        }
      } else {
        createEmulator(selectedOS, '');
      }
    }
  };

  const createEmulator = async (os: string, version: string) => {
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
    }
  };

  const deleteResource = async (name: string, nickName: string) => {
    try {
      const response = await fetch('http://10.160.83.213:8309/dhub/emulator/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pod_name: name, creator: nickName})
      });
      if (!response.ok) {
        throw new Error('Failed to delete resource');
      }
      // Refresh resources after deletion
      fetchResources(nickname);
    } catch (error) {
      console.error(error);
    }
  };


  const launchVNC = (port: number) => {
    window.open(`http://10.160.24.17:${port}/?password=fortinet`, '_blank');
  };

  const handleRefresh = () => {
    window.location.reload();
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
        />
      ) : (
        <NickNamePage onSubmit={handleNicknameSubmit} />
      )}
    </div>
  );
};

export default App;
