import React, { useState, useEffect } from 'react';
import NicknamePrompt from './NicknamePrompt';

interface ProtectedRouteProps {
  nickname: string;
  handleNicknameSubmit: (nickname: string) => void;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  nickname,
  handleNicknameSubmit,
  children
}) => {
  const [showPrompt, setShowPrompt] = useState<boolean>(false);

  useEffect(() => {
    // Show prompt if no nickname is set
    if (!nickname) {
      setShowPrompt(true);
    } else {
      setShowPrompt(false);
    }
  }, [nickname]);

  const handleSubmit = (newNickname: string) => {
    handleNicknameSubmit(newNickname);
    setShowPrompt(false);
  };

  // If no nickname, show the modal and don't render children yet
  if (!nickname) {
    return (
      <>
        <NicknamePrompt isOpen={showPrompt} onSubmit={handleSubmit} />
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
          <p className="text-muted">Please enter your nickname to continue...</p>
        </div>
      </>
    );
  }

  // If nickname exists, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
