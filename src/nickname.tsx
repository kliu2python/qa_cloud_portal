import React, { useState } from 'react';

interface NickNamePageProps {
  onSubmit: (nickname: string) => void;
}

const NickNamePage: React.FC<NickNamePageProps> = ({ onSubmit }) => {
  const [nicknameInput, setNicknameInput] = useState('');

  const handleNicknameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNicknameInput(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(nicknameInput);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          Enter your nickname:
          <input type="text" value={nicknameInput} onChange={handleNicknameChange} />
        </label>
        <button type="submit">Continue</button>
      </form>
    </div>
  );
};

export default NickNamePage;
