import React, { useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { Collaboration, Personnel, Agent, Product, Customer, Contract, Meeting, BusinessTrip } from './types';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { QuickLinks } from './components/QuickLinks';
import { BusinessTrips } from './components/BusinessTrips';
import { Meetings } from './components/Meetings';
import { Collaborations } from './components/Collaborations';
import { MasterData } from './components/MasterData';
import { Contracts } from './components/Contracts';

export type View = 'dashboard' | 'quick-links' | 'business-trips' | 'meetings' | 'collaborations' | 'contracts' | 'master-data';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');

  // Master Data State
  const [personnel, setPersonnel] = useLocalStorage<Personnel[]>('personnel', []);
  const [agents, setAgents] = useLocalStorage<Agent[]>('agents', []);
  const [products, setProducts] = useLocalStorage<Product[]>('products', []);
  const [customers, setCustomers] = useLocalStorage<Customer[]>('customers', []);

  // Module-specific State
  const [collaborations, setCollaborations] = useLocalStorage<Collaboration[]>('collaborations', []);
  const [contracts, setContracts] = useLocalStorage<Contract[]>('contracts', []);
  const [meetings, setMeetings] = useLocalStorage<Meeting[]>('meetings', []);
  const [trips, setTrips] = useLocalStorage<BusinessTrip[]>('businessTrips', []);


  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'quick-links':
        return <QuickLinks />;
      case 'business-trips':
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
      case 'contracts':
        return <Contracts 
                  contracts={contracts}
                  setContracts={setContracts}
                  personnel={personnel}
                  agents={agents}
                  products={products}
                />;
      case 'master-data':
        return <MasterData 
                  personnel={personnel} setPersonnel={setPersonnel}
                  agents={agents} setAgents={setAgents}
                  products={products} setProducts={setProducts}
                  customers={customers} setCustomers={setCustomers}
                  setCollaborations={setCollaborations}
                  setContracts={setContracts}
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