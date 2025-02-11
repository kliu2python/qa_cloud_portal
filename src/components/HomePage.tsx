import React from 'react';

interface HomePageProps {
  nickName?: string; // Made it optional to handle cases where it might not be passed
}

const HomePage: React.FC<HomePageProps> = ({ nickName }) => {
  const un = nickName || 'Guest';

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Welcome {un} to the TaaS - Test as a Service</h1>
      <p>
        {nickName
          ? 'You have access to these resources.'
          : "You don't have the right to use most services. Please log in with your nickname (no registration needed)."}
      </p>
    </div>
  );
};

export default HomePage;
