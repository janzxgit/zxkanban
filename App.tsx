// Fix: Implement the main App component with state management for view navigation and layout.
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { BusinessTrips } from './components/BusinessTrips';
import { Meetings } from './components/Meetings';
import { Collaborations } from './components/Collaborations';
import { MasterData } from './components/MasterData';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { Personnel, Agent, Product, Customer, Collaboration } from './types';


type View = 'dashboard' | 'trips' | 'meetings' | 'collaborations' | 'master-data';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  
  // Lifted state for all data
  const [personnel, setPersonnel] = useLocalStorage<Personnel[]>('personnel', []);
  const [agents, setAgents] = useLocalStorage<Agent[]>('agents', []);
  const [products, setProducts] = useLocalStorage<Product[]>('products', []);
  const [customers, setCustomers] = useLocalStorage<Customer[]>('customers', []);
  const [collaborations, setCollaborations] = useLocalStorage<Collaboration[]>('collaborations', []);


  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'trips':
        return <BusinessTrips />;
      case 'meetings':
        return <Meetings personnel={personnel} />;
      case 'collaborations':
        return <Collaborations 
                    collaborations={collaborations}
                    setCollaborations={setCollaborations}
                    personnel={personnel}
                    agents={agents}
                    products={products}
                    customers={customers}
                />;
      case 'master-data':
        return <MasterData 
                    personnel={personnel} setPersonnel={setPersonnel}
                    agents={agents} setAgents={setAgents}
                    products={products} setProducts={setProducts}
                    customers={customers} setCustomers={setCustomers}
                    setCollaborations={setCollaborations}
                />;
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