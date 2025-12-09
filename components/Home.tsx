import React from 'react';
import { FileText, Contact, MessageCircle, QrCode } from 'lucide-react';
import { View } from '../types';

interface HomeProps {
  onNavigate: (view: View) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  return (
    <div className="w-full">
      {/* Hero Banner */}
      <div className="relative w-full h-[400px] bg-gray-900 border-b border-white/10 overflow-hidden group">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1600&q=80')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/60 to-transparent" />
        
        {/* Shine Effect */}
        <div className="absolute top-0 -left-[200px] w-[200px] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-shine" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 p-8 md:p-16 max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white drop-shadow-lg">
            All-in-One <span className="text-brand-lime">Smart Creator</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 drop-shadow-md">
            Create professional resumes, digital visiting cards, and QR codes instantly. No login required.
          </p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ToolCard 
            title="Resume Builder" 
            desc="AI-powered resumes in minutes."
            icon={<FileText className="w-8 h-8 text-brand-lime" />}
            onClick={() => onNavigate(View.RESUME)}
          />
          <ToolCard 
            title="Visiting Card" 
            desc="Design digital cards effortlessly."
            icon={<Contact className="w-8 h-8 text-purple-400" />}
            onClick={() => onNavigate(View.VISITING_CARD)}
          />
          <ToolCard 
            title="WhatsApp QR" 
            desc="Direct message links & QRs."
            icon={<MessageCircle className="w-8 h-8 text-green-400" />}
            onClick={() => onNavigate(View.WHATSAPP_QR)}
          />
          <ToolCard 
            title="QR Generator" 
            desc="URLs, Text, WiFi and more."
            icon={<QrCode className="w-8 h-8 text-blue-400" />}
            onClick={() => onNavigate(View.GENERAL_QR)}
          />
        </div>
      </div>
    </div>
  );
};

const ToolCard: React.FC<{ title: string; desc: string; icon: React.ReactNode; onClick: () => void }> = ({ title, desc, icon, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-brand-gray border border-white/10 rounded-2xl p-6 cursor-pointer hover:border-brand-lime/50 hover:-translate-y-2 transition-all duration-300 group"
  >
    <div className="mb-4 bg-white/5 w-14 h-14 rounded-xl flex items-center justify-center group-hover:bg-white/10 transition-colors">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-2 group-hover:text-brand-lime transition-colors">{title}</h3>
    <p className="text-gray-400 text-sm">{desc}</p>
  </div>
);