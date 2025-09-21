// Fix: Implement the main App component with state management for view navigation and layout.
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { BusinessTrips } from './components/BusinessTrips';
import { Meetings } from './components/Meetings';
import { Collaborations } from './components/Collaborations';
import { MasterData } from './components/MasterData';

type View = 'dashboard' | 'trips' | 'meetings' | 'collaborations' | 'master-data';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'trips':
        return <BusinessTrips />;
      case 'meetings':
        return <Meetings />;
      case 'collaborations':
        return <Collaborations />;
      case 'master-data':
        return <MasterData />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
