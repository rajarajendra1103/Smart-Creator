import React, { useState } from 'react';
import { ArrowLeft, QrCode, Link, Type, Wifi, Download, Mail } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

interface GeneralQrProps {
  onBack: () => void;
}

enum QrType {
  URL = 'URL',
  TEXT = 'TEXT',
  WIFI = 'WIFI',
  EMAIL = 'EMAIL'
}

export const GeneralQr: React.FC<GeneralQrProps> = ({ onBack }) => {
  const [type, setType] = useState<QrType>(QrType.URL);
  const [value, setValue] = useState('');
  
  // Wifi Specific State
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [encryption, setEncryption] = useState('WPA');

  // Email Specific State
  const [email, setEmail] = useState('');

  const getQrValue = () => {
    if (type === QrType.WIFI) {
      return `WIFI:T:${encryption};S:${ssid};P:${password};;`;
    }
    if (type === QrType.EMAIL) {
      return `mailto:${email}`;
    }
    return value;
  };

  const downloadQR = () => {
    const canvas = document.getElementById('gen-qr') as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = "custom-qr.png";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 mt-8">
       <button onClick={onBack} className="flex items-center text-gray-400 hover:text-white transition-colors mb-8">
        <ArrowLeft className="w-5 h-5 mr-2" /> Back
      </button>

      <div className="bg-brand-gray border border-white/10 rounded-3xl p-8 overflow-hidden relative">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <QrCode className="w-6 h-6 mr-3 text-brand-lime" /> Generator
        </h2>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-white/10 pb-4 overflow-x-auto">
          <TabButton active={type === QrType.URL} onClick={() => setType(QrType.URL)} icon={<Link className="w-4 h-4 mr-2"/>} label="URL" />
          <TabButton active={type === QrType.TEXT} onClick={() => setType(QrType.TEXT)} icon={<Type className="w-4 h-4 mr-2"/>} label="Text" />
          <TabButton active={type === QrType.WIFI} onClick={() => setType(QrType.WIFI)} icon={<Wifi className="w-4 h-4 mr-2"/>} label="Wi-Fi" />
          <TabButton active={type === QrType.EMAIL} onClick={() => setType(QrType.EMAIL)} icon={<Mail className="w-4 h-4 mr-2"/>} label="Email" />
        </div>

        <div className="flex flex-col md:flex-row gap-12">
          {/* Inputs */}
          <div className="flex-1 space-y-4">
             {type === QrType.URL && (
               <Input placeholder="https://yourwebsite.com" value={value} onChange={setValue} label="Website URL" />
             )}
             {type === QrType.TEXT && (
               <div className="space-y-1">
                 <label className="text-sm text-gray-400">Content</label>
                 <textarea 
                    value={value} 
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full bg-brand-black border border-white/20 rounded-xl p-4 text-white focus:border-brand-lime outline-none h-32"
                    placeholder="Enter any text here..."
                 />
               </div>
             )}
             {type === QrType.WIFI && (
               <div className="space-y-4">
                  <Input placeholder="Network Name" value={ssid} onChange={setSsid} label="SSID / Network Name" />
                  <Input placeholder="Network Password" value={password} onChange={setPassword} label="Password" />
                  <div className="space-y-1">
                    <label className="text-sm text-gray-400">Security</label>
                    <select 
                      value={encryption} 
                      onChange={(e) => setEncryption(e.target.value)}
                      className="w-full bg-brand-black border border-white/20 rounded-xl p-4 text-white focus:border-brand-lime outline-none"
                    >
                      <option value="WPA">WPA/WPA2</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">None</option>
                    </select>
                  </div>
               </div>
             )}
             {type === QrType.EMAIL && (
               <Input placeholder="user@example.com" value={email} onChange={setEmail} label="Email Address" />
             )}
          </div>

          {/* Output */}
          <div className="flex-1 flex flex-col items-center justify-center">
             <div className="bg-white p-4 rounded-xl shadow-2xl mb-6">
                <QRCodeCanvas 
                  id="gen-qr"
                  value={getQrValue() || "placeholder"} 
                  size={220}
                  level={"M"}
                />
             </div>
             <button 
               onClick={downloadQR}
               className="flex items-center bg-brand-lime hover:bg-lime-400 text-brand-black px-8 py-3 rounded-full font-bold transition-all shadow-lg shadow-brand-lime/20"
             >
               <Download className="w-4 h-4 mr-2" /> Download QR
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${active ? 'bg-white/10 text-brand-lime' : 'text-gray-400 hover:text-white'}`}
  >
    {icon} {label}
  </button>
);

const Input: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder: string }> = ({ label, value, onChange, placeholder }) => (
  <div className="space-y-1">
    <label className="text-sm text-gray-400">{label}</label>
    <input 
      type="text" 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-brand-black border border-white/20 rounded-xl p-4 text-white focus:border-brand-lime outline-none transition-colors"
      placeholder={placeholder}
    />
  </div>
);
