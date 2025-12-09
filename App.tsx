import React, { useState } from 'react';
import { Home } from './components/Home';
import { ResumeBuilder } from './components/ResumeBuilder';
import { VisitingCard } from './components/VisitingCard';
import { WhatsAppQr } from './components/WhatsAppQr';
import { GeneralQr } from './components/GeneralQr';
import { View } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.HOME);

  const renderView = () => {
    switch (currentView) {
      case View.RESUME:
        return <ResumeBuilder onBack={() => setCurrentView(View.HOME)} />;
      case View.VISITING_CARD:
        return <VisitingCard onBack={() => setCurrentView(View.HOME)} />;
      case View.WHATSAPP_QR:
        return <WhatsAppQr onBack={() => setCurrentView(View.HOME)} />;
      case View.GENERAL_QR:
        return <GeneralQr onBack={() => setCurrentView(View.HOME)} />;
      case View.HOME:
      default:
        return <Home onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-brand-black text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-brand-black/95 backdrop-blur sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer group" 
            onClick={() => setCurrentView(View.HOME)}
          >
            <div className="w-8 h-8 bg-brand-lime rounded-lg flex items-center justify-center text-brand-black font-bold text-xl transition-transform group-hover:rotate-12">
              S
            </div>
            <span className="font-bold text-xl tracking-tight">Smart<span className="text-brand-lime">Creator</span></span>
          </div>
          
          <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-400">
             <button onClick={() => setCurrentView(View.RESUME)} className="hover:text-brand-lime transition-colors">Resume</button>
             <button onClick={() => setCurrentView(View.VISITING_CARD)} className="hover:text-brand-lime transition-colors">Visiting Card</button>
             <button onClick={() => setCurrentView(View.WHATSAPP_QR)} className="hover:text-brand-lime transition-colors">WhatsApp QR</button>
             <button onClick={() => setCurrentView(View.GENERAL_QR)} className="hover:text-brand-lime transition-colors">QR Gen</button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {renderView()}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 bg-brand-gray mt-auto no-print">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Smart Creator Studio. Built with React.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;