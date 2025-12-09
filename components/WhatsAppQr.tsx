import React, { useState } from 'react';
import { ArrowLeft, MessageCircle, Download } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

interface WhatsAppQrProps {
  onBack: () => void;
}

export const WhatsAppQr: React.FC<WhatsAppQrProps> = ({ onBack }) => {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  // Construct WhatsApp URL
  const waUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
  const isValid = phone.length > 5;

  const downloadQR = () => {
    const canvas = document.getElementById('wa-qr') as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = "whatsapp-qr.png";
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

      <div className="bg-brand-gray border border-white/10 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row gap-12">
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-900/30 rounded-full text-green-400">
               <MessageCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">WhatsApp Link Generator</h2>
              <p className="text-gray-400 text-sm">Create a QR code that opens a chat instantly.</p>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Phone Number (with Country Code)</label>
            <input 
              type="text" 
              placeholder="e.g. 15551234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-brand-black border border-white/20 rounded-xl p-4 text-white focus:border-green-500 outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">Pre-filled Message (Optional)</label>
            <textarea 
              placeholder="Hi! I'm interested in your services..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-brand-black border border-white/20 rounded-xl p-4 text-white focus:border-green-500 outline-none h-32 resize-none"
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center bg-brand-black/50 rounded-2xl p-8 border border-white/5">
           <div className="bg-white p-4 rounded-xl shadow-2xl mb-6">
             {isValid ? (
               <QRCodeCanvas 
                 id="wa-qr"
                 value={waUrl}
                 size={200}
                 level={"H"}
                 imageSettings={{
                   src: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1200px-WhatsApp.svg.png",
                   x: undefined,
                   y: undefined,
                   height: 40,
                   width: 40,
                   excavate: true,
                 }}
               />
             ) : (
                <div className="w-[200px] h-[200px] bg-gray-100 flex items-center justify-center text-gray-400 text-center text-sm p-4">
                  Enter phone number to generate
                </div>
             )}
           </div>
           
           <button 
             onClick={downloadQR}
             disabled={!isValid}
             className="flex items-center bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-full font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
           >
             <Download className="w-4 h-4 mr-2" /> Download QR
           </button>
        </div>
      </div>
    </div>
  );
};
