import React from 'react';

interface HomePageProps {
  onSelectSinglePlayer: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onSelectSinglePlayer }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <button
        onClick={onSelectSinglePlayer}
        className="px-8 py-4 text-2xl font-bold text-white bg-blue-500 rounded-lg hover:bg-blue-700"
      >
        Play Single Player
      </button>
    </div>
  );
};

export default HomePage;