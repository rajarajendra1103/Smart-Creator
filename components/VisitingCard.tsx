import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Download, Undo, Redo, 
  Type, Image as ImageIcon, Square, Circle, Minus, 
  Bold, Italic, Underline, Strikethrough, 
  AlignLeft, AlignCenter, AlignRight,
  Copy, Clipboard, Trash2, Scissors,
  List, ListOrdered, MousePointer2,
  User, Phone, Mail, Globe, Building, MapPin, Smartphone, Star,
  Save, X, Layers, CreditCard, Layout, QrCode, Upload
} from 'lucide-react';
import { CanvasItem, CanvasItemStyle, ToolType } from '../types';
import html2canvas from 'html2canvas';
import { QRCodeCanvas } from 'qrcode.react';

interface VisitingCardProps {
  onBack: () => void;
}

// Card Dimensions (3.5 x 2 inches @ ~150 DPI for screen)
const CARD_WIDTH = 600;
const CARD_HEIGHT = 350;
const CARD_GAP = 40; // Gap between front and back side in double mode

const FONTS = ['Inter', 'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Helvetica'];

const DEFAULT_STYLE: CanvasItemStyle = {
  fontSize: 16,
  fontFamily: 'Inter',
  color: '#000000',
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  textAlign: 'left',
  lineHeight: 1.2
};

const SIDEBAR_TOOLS = [
  { id: 'NAME', label: 'Name', icon: <User size={20} />, defaultText: 'YOUR NAME' },
  { id: 'PHONE', label: 'Phone', icon: <Phone size={20} />, defaultText: '+1 234 567 890' },
  { id: 'EMAIL', label: 'Email', icon: <Mail size={20} />, defaultText: 'email@example.com' },
  { id: 'WEBSITE', label: 'Website', icon: <Globe size={20} />, defaultText: 'www.website.com' },
  { id: 'COMPANY', label: 'Company Name', icon: <Building size={20} />, defaultText: 'COMPANY NAME' },
  { id: 'TAGLINE', label: 'Tagline', icon: <Star size={20} />, defaultText: 'Your Tagline Goes Here' },
  { id: 'ADDRESS', label: 'Full Address', icon: <MapPin size={20} />, defaultText: '123 Street Name, City, Country' },
  { id: 'SEC_PHONE', label: 'Secondary Phone', icon: <Smartphone size={20} />, defaultText: '+1 987 654 321' },
];

export const VisitingCard: React.FC<VisitingCardProps> = ({ onBack }) => {
  // Setup & Layout State
  const [showLayoutModal, setShowLayoutModal] = useState(true);
  const [layoutMode, setLayoutMode] = useState<'single' | 'double'>('single');

  // History & Editor State
  const [history, setHistory] = useState<CanvasItem[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<CanvasItem | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  
  // QR State
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  
  // Dragging
  const [isDragging, setIsDragging] = useState(false);
  const dragItemRef = useRef<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const items = history[historyIndex];
  const selectedItem = items.find(i => i.id === selectedItemId);

  // Load default template or local storage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('smart-creator-card-draft');
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            // Handle legacy array format vs new object format
            if (Array.isArray(parsed)) {
                 setHistory([parsed]);
                 setHistoryIndex(0);
                 setShowLayoutModal(false);
            } else if (parsed.items && parsed.layoutMode) {
                 setHistory([parsed.items]);
                 setHistoryIndex(0);
                 setLayoutMode(parsed.layoutMode);
                 setShowLayoutModal(false);
            }
        } catch(e) {
            console.error("Failed to load saved draft", e);
        }
    }
    // If no save data, showLayoutModal remains true
  }, []);

  // --- Actions ---

  const handleLayoutSelection = (mode: 'single' | 'double') => {
    setLayoutMode(mode);
    setShowLayoutModal(false);
    
    // Initialize blank canvas based on mode
    const initialItems: CanvasItem[] = [
        { id: 'bg-front', type: 'SHAPE', x: 0, y: 0, data: { shapeType: 'rectangle' }, style: { width: CARD_WIDTH, height: CARD_HEIGHT, backgroundColor: '#ffffff', borderWidth: 0 } }
    ];
    
    if (mode === 'double') {
        initialItems.push(
             { id: 'bg-back', type: 'SHAPE', x: 0, y: CARD_HEIGHT + CARD_GAP, data: { shapeType: 'rectangle' }, style: { width: CARD_WIDTH, height: CARD_HEIGHT, backgroundColor: '#ffffff', borderWidth: 0 } }
        );
    }
    
    setHistory([initialItems]);
    setHistoryIndex(0);
  };

  const setItems = (newItems: CanvasItem[], addToHistory = true) => {
    if (addToHistory) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newItems);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    } else {
      const newHistory = [...history];
      newHistory[historyIndex] = newItems;
      setHistory(newHistory);
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setSelectedItemId(null);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setSelectedItemId(null);
    }
  };

  const saveWork = () => {
    const savePayload = {
        items: items,
        layoutMode: layoutMode,
        timestamp: Date.now()
    };
    localStorage.setItem('smart-creator-card-draft', JSON.stringify(savePayload));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const downloadCard = async () => {
    if (cardRef.current) {
      setSelectedItemId(null); // Deselect to hide handles
      setTimeout(async () => {
        if (!cardRef.current) return;
        // Adjust scale for high quality print
        const canvas = await html2canvas(cardRef.current, { 
            scale: 3, 
            backgroundColor: null,
            height: cardRef.current.scrollHeight // Ensure full height capture
        });
        const image = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = image;
        link.download = `BusinessCard-${layoutMode}.png`;
        link.click();
      }, 100);
    }
  };

  const handleGenerateQr = async () => {
    if (cardRef.current) {
        setSelectedItemId(null);
        setTimeout(async () => {
            if (!cardRef.current) return;
            try {
                const canvas = await html2canvas(cardRef.current, { 
                    scale: 2, 
                    backgroundColor: null,
                    height: cardRef.current.scrollHeight 
                });
                canvas.toBlob((blob) => {
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        setQrUrl(url);
                        setShowQrModal(true);
                    }
                });
            } catch (error) {
                console.error("Failed to generate QR blob", error);
            }
        }, 100);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const result = event.target?.result;
          if (typeof result === 'string') {
            const parsed = JSON.parse(result);
            // Handle both array format and object format with layoutMode
            if (Array.isArray(parsed)) {
                 setItems(parsed);
            } else if (parsed.items) {
                 if (Array.isArray(parsed.items)) setItems(parsed.items);
                 if (parsed.layoutMode) setLayoutMode(parsed.layoutMode);
            } else {
                alert("Invalid template file.");
            }
          }
        } catch (error) {
          console.error("Error parsing JSON", error);
          alert("Failed to load template.");
        }
      };
      reader.readAsText(file);
    }
    if (importFileRef.current) importFileRef.current.value = '';
  };

  // --- CRUD ---

  const addItem = (type: ToolType, extraData: any = {}, extraStyle: CanvasItemStyle = {}, xPos?: number, yPos?: number) => {
    const newItem: CanvasItem = {
      id: Date.now().toString(),
      type,
      x: xPos ?? (CARD_WIDTH / 2 - 50),
      y: yPos ?? (CARD_HEIGHT / 2 - 20),
      data: { ...extraData },
      style: { ...DEFAULT_STYLE, ...extraStyle }
    };

    if (type === 'SHAPE' && !xPos) {
        newItem.x = CARD_WIDTH / 2 - 50;
        newItem.y = CARD_HEIGHT / 2 - 50;
    }

    setItems([...items, newItem]);
    setSelectedItemId(newItem.id);
  };

  const removeItem = () => {
    if (selectedItemId && !selectedItemId.startsWith('bg-')) {
      setItems(items.filter(i => i.id !== selectedItemId));
      setSelectedItemId(null);
    }
  };

  const updateItemStyle = (updates: Partial<CanvasItemStyle>) => {
    if (!selectedItemId) return;
    const newItems = items.map(item => 
      item.id === selectedItemId 
        ? { ...item, style: { ...item.style, ...updates } }
        : item
    );
    setItems(newItems);
  };

  const updateItemData = (key: string, value: any) => {
     if (!selectedItemId) return;
     const newItems = items.map(item => 
       item.id === selectedItemId 
         ? { ...item, data: { ...item.data, [key]: value } }
         : item
     );
     setItems(newItems);
  };

  // --- Templates ---

  const loadTemplate = (index: number) => {
    // Determine background color based on template
    let bgCol = '#ffffff';
    if (index === 0) bgCol = '#101010';
    if (index === 2) bgCol = '#1e3a8a';

    // Base items (Backgrounds)
    let newItems: CanvasItem[] = [
        { id: 'bg-front', type: 'SHAPE', x: 0, y: 0, data: { shapeType: 'rectangle' }, style: { width: CARD_WIDTH, height: CARD_HEIGHT, backgroundColor: bgCol, borderWidth: 0 } }
    ];

    if (layoutMode === 'double') {
        newItems.push(
            { id: 'bg-back', type: 'SHAPE', x: 0, y: CARD_HEIGHT + CARD_GAP, data: { shapeType: 'rectangle' }, style: { width: CARD_WIDTH, height: CARD_HEIGHT, backgroundColor: bgCol, borderWidth: 0 } }
        );
    }

    // Template Specific Items
    switch(index) {
        case 0: // Classic Dark
            newItems.push(
                { id: 't1', type: 'TEXT', x: 40, y: 60, data: { text: 'ALEXANDER DOE' }, style: { ...DEFAULT_STYLE, fontSize: 28, color: '#ffffff', fontWeight: 'bold' } },
                { id: 't2', type: 'TEXT', x: 40, y: 100, data: { text: 'Senior Software Architect' }, style: { ...DEFAULT_STYLE, fontSize: 14, color: '#B2E800' } },
                { id: 'l1', type: 'SHAPE', x: 40, y: 130, data: { shapeType: 'line' }, style: { width: 50, height: 2, backgroundColor: '#B2E800' } },
                { id: 't3', type: 'TEXT', x: 40, y: 220, data: { text: '+1 234 567 8900' }, style: { ...DEFAULT_STYLE, fontSize: 12, color: '#cccccc' } },
                { id: 't4', type: 'TEXT', x: 40, y: 240, data: { text: 'alex.doe@example.com' }, style: { ...DEFAULT_STYLE, fontSize: 12, color: '#cccccc' } },
                { id: 't5', type: 'TEXT', x: 40, y: 260, data: { text: 'www.alexdoe.dev' }, style: { ...DEFAULT_STYLE, fontSize: 12, color: '#cccccc' } },
                { id: 's1', type: 'SHAPE', x: 450, y: -50, data: { shapeType: 'circle' }, style: { width: 200, height: 200, backgroundColor: '#1a1a1a' } }
            );
            break;
        case 1: // Elegant White
            newItems.push(
                { id: 't1', type: 'TEXT', x: 300, y: 120, data: { text: 'SARAH CONNOR' }, style: { ...DEFAULT_STYLE, fontSize: 24, color: '#000000', textAlign: 'center', fontWeight: 'bold' } },
                { id: 't2', type: 'TEXT', x: 300, y: 155, data: { text: 'Creative Director' }, style: { ...DEFAULT_STYLE, fontSize: 14, color: '#666666', textAlign: 'center', fontStyle: 'italic' } },
                { id: 's1', type: 'SHAPE', x: 250, y: 180, data: { shapeType: 'line' }, style: { width: 100, height: 1, backgroundColor: '#000000' } },
                { id: 't3', type: 'TEXT', x: 300, y: 280, data: { text: 'sarah@studio.com  |  +1 987 654 3210' }, style: { ...DEFAULT_STYLE, fontSize: 10, color: '#333333', textAlign: 'center' } },
                { id: 'b1', type: 'SHAPE', x: 20, y: 20, data: { shapeType: 'rectangle' }, style: { width: CARD_WIDTH - 40, height: CARD_HEIGHT - 40, borderColor: '#000000', borderWidth: 2, backgroundColor: 'transparent' } }
            );
            break;
        case 2: // Ocean Blue
            newItems.push(
                { id: 's1', type: 'SHAPE', x: 0, y: 0, data: { shapeType: 'rectangle' }, style: { width: 20, height: CARD_HEIGHT, backgroundColor: '#60a5fa' } },
                { id: 't1', type: 'TEXT', x: 50, y: 50, data: { text: 'JOHN SMITH' }, style: { ...DEFAULT_STYLE, fontSize: 32, color: '#ffffff', fontWeight: 'bold' } },
                { id: 't2', type: 'TEXT', x: 50, y: 90, data: { text: 'MARINE BIOLOGIST' }, style: { ...DEFAULT_STYLE, fontSize: 12, color: '#93c5fd', letterSpacing: '2px' } },
                { id: 't3', type: 'TEXT', x: 50, y: 250, data: { text: '123 Ocean Drive, Miami, FL' }, style: { ...DEFAULT_STYLE, fontSize: 11, color: '#e0f2fe' } },
                { id: 't4', type: 'TEXT', x: 50, y: 270, data: { text: 'john@ocean.org' }, style: { ...DEFAULT_STYLE, fontSize: 11, color: '#e0f2fe' } },
            );
            break;
    }
    setItems(newItems);
    setSelectedItemId(null);
  };

  // --- Interaction Handlers ---

  const handleToolSelect = (toolId: string) => {
    setSelectedTool(toolId);
    setSelectedItemId(null);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedTool && !isDragging && cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Valid click area logic
        const clickedFront = (y >= 0 && y <= CARD_HEIGHT);
        const clickedBack = layoutMode === 'double' && (y >= CARD_HEIGHT + CARD_GAP && y <= CARD_HEIGHT * 2 + CARD_GAP);

        if (clickedFront || clickedBack) {
            const tool = SIDEBAR_TOOLS.find(t => t.id === selectedTool);
            if (tool) {
                // Adjust x/y to center the text roughly where clicked
                addItem('TEXT', { text: tool.defaultText }, {}, x - 50, y - 10);
            }
            setSelectedTool(null);
        }
    } else {
        // Deselect if clicking on empty space (handled by wrapper click but good to have safety)
    }
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // Prevent dragging background
    if (id.startsWith('bg-')) return;

    dragItemRef.current = id;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setIsDragging(true);
    setSelectedItemId(id);
    setSelectedTool(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && dragItemRef.current) {
      const canvasRect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - canvasRect.left - dragOffset.current.x;
      const y = e.clientY - canvasRect.top - dragOffset.current.y;
      
      const newItems = items.map(item => 
        item.id === dragItemRef.current ? { ...item, x, y } : item
      );
      
      const tempHistory = [...history];
      tempHistory[historyIndex] = newItems;
      setHistory(tempHistory);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setItems(history[historyIndex], true);
    }
    setIsDragging(false);
    dragItemRef.current = null;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        addItem('IMAGE', { src: event.target?.result }, { width: 100, height: 100 });
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Renderers ---

  const renderToolbar = () => {
    const s = selectedItem?.style || {};
    const hasSelection = !!selectedItem && !selectedItem.id.startsWith('bg-');
    const isText = selectedItem?.type === 'TEXT';

    return (
      <div className="h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-2 overflow-x-auto shadow-sm select-none z-20 text-gray-900 shrink-0 whitespace-nowrap">
        
        {/* History */}
        <div className="flex gap-1 pr-2 border-r border-gray-200 shrink-0">
          <button onClick={undo} disabled={historyIndex === 0} className="p-2 hover:bg-gray-100 rounded text-gray-700 disabled:opacity-30"><Undo size={18} /></button>
          <button onClick={redo} disabled={historyIndex === history.length - 1} className="p-2 hover:bg-gray-100 rounded text-gray-700 disabled:opacity-30"><Redo size={18} /></button>
        </div>

        {/* Text Styling (Only if Text selected) */}
        <div className={`flex gap-2 items-center pr-2 border-r border-gray-200 shrink-0 ${!isText ? 'opacity-40 pointer-events-none' : ''}`}>
           <select 
             value={s.fontFamily || 'Inter'} 
             onChange={(e) => updateItemStyle({ fontFamily: e.target.value })}
             className="w-24 border rounded px-2 py-1 text-xs text-gray-900"
           >
             {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
           </select>
           <input 
             type="number" 
             value={s.fontSize || 16} 
             onChange={(e) => updateItemStyle({ fontSize: parseInt(e.target.value) })}
             className="w-12 border rounded px-1 py-1 text-xs text-center text-gray-900"
             title="Font Size"
           />
           <input 
             type="number" 
             step="0.1"
             value={s.lineHeight || 1.2} 
             onChange={(e) => updateItemStyle({ lineHeight: parseFloat(e.target.value) })}
             className="w-12 border rounded px-1 py-1 text-xs text-center text-gray-900"
             title="Line Spacing"
           />
           <div className="flex gap-0.5">
             <button onClick={() => updateItemStyle({ fontWeight: s.fontWeight === 'bold' ? 'normal' : 'bold' })} className={`p-1.5 rounded ${s.fontWeight === 'bold' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}><Bold size={16} /></button>
             <button onClick={() => updateItemStyle({ fontStyle: s.fontStyle === 'italic' ? 'normal' : 'italic' })} className={`p-1.5 rounded ${s.fontStyle === 'italic' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}><Italic size={16} /></button>
             <button onClick={() => updateItemStyle({ textDecoration: s.textDecoration === 'underline' ? 'none' : 'underline' })} className={`p-1.5 rounded ${s.textDecoration === 'underline' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}><Underline size={16} /></button>
             <button onClick={() => updateItemStyle({ textDecoration: s.textDecoration === 'line-through' ? 'none' : 'line-through' })} className={`p-1.5 rounded ${s.textDecoration === 'line-through' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}><Strikethrough size={16} /></button>
           </div>
           <div className="flex gap-0.5">
             <button onClick={() => updateItemStyle({ textAlign: 'left' })} className={`p-1.5 rounded ${s.textAlign === 'left' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}><AlignLeft size={16} /></button>
             <button onClick={() => updateItemStyle({ textAlign: 'center' })} className={`p-1.5 rounded ${s.textAlign === 'center' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}><AlignCenter size={16} /></button>
             <button onClick={() => updateItemStyle({ textAlign: 'right' })} className={`p-1.5 rounded ${s.textAlign === 'right' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}><AlignRight size={16} /></button>
           </div>
        </div>

        {/* Colors (RGB) */}
        <div className="flex items-center gap-2 pr-2 border-r border-gray-200 shrink-0">
           <div className={`flex flex-col items-center group relative ${!hasSelection ? 'opacity-40 pointer-events-none' : ''}`}>
             <label className="text-[9px] text-gray-500 uppercase font-bold">Text</label>
             <input 
               type="color" 
               value={s.color || '#000000'} 
               onChange={(e) => updateItemStyle({ color: e.target.value })}
               className="w-6 h-6 rounded cursor-pointer border border-gray-300 p-0 overflow-hidden text-gray-900"
               title="Text Color (RGB)"
             />
           </div>
           <div className={`flex flex-col items-center group relative ${!hasSelection ? 'opacity-40 pointer-events-none' : ''}`}>
             <label className="text-[9px] text-gray-500 uppercase font-bold">BG</label>
             <input 
               type="color" 
               value={s.backgroundColor || '#ffffff'} 
               onChange={(e) => updateItemStyle({ backgroundColor: e.target.value })}
               className="w-6 h-6 rounded cursor-pointer border border-gray-300 p-0 overflow-hidden text-gray-900"
               title="Background Color (RGB)"
             />
           </div>
        </div>

        {/* Clipboard */}
        <div className="flex gap-1 pr-2 border-r border-gray-200 shrink-0">
           <button onClick={() => { if(selectedItem) { setClipboard(selectedItem); removeItem(); } }} disabled={!hasSelection} className="p-2 hover:bg-gray-100 rounded text-gray-700 disabled:opacity-30" title="Cut"><Scissors size={18} /></button>
           <button onClick={() => selectedItem && setClipboard(selectedItem)} disabled={!hasSelection} className="p-2 hover:bg-gray-100 rounded text-gray-700 disabled:opacity-30" title="Copy"><Copy size={18} /></button>
           <button onClick={() => { if(clipboard) { addItem(clipboard.type, clipboard.data, clipboard.style) } }} disabled={!clipboard} className="p-2 hover:bg-gray-100 rounded text-gray-700 disabled:opacity-30" title="Paste"><Clipboard size={18} /></button>
           <button onClick={removeItem} disabled={!hasSelection} className="p-2 hover:bg-red-100 text-red-500 rounded disabled:opacity-30" title="Delete"><Trash2 size={18} /></button>
        </div>

        {/* Insert Tools */}
        <div className="flex gap-2 items-center pr-2 border-r border-gray-200 shrink-0">
           <button onClick={() => addItem('TEXT', { text: 'New Text' })} className="flex flex-col items-center p-1 hover:bg-gray-100 rounded text-xs text-gray-600">
              <Type size={18} /> <span className="text-[10px]">Text</span>
           </button>
           <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center p-1 hover:bg-gray-100 rounded text-xs text-gray-600">
              <ImageIcon size={18} /> <span className="text-[10px]">Image</span>
           </button>
           <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />

           <div className="flex gap-0.5">
             <button onClick={() => addItem('SHAPE', { shapeType: 'rectangle' }, { width: 100, height: 100, backgroundColor: '#B2E800' })} className="p-2 hover:bg-gray-100 rounded" title="Rectangle"><Square size={16} /></button>
             <button onClick={() => addItem('SHAPE', { shapeType: 'circle' }, { width: 100, height: 100, backgroundColor: '#B2E800', borderRadius: 999 })} className="p-2 hover:bg-gray-100 rounded" title="Circle"><Circle size={16} /></button>
             <button onClick={() => addItem('SHAPE', { shapeType: 'line' }, { width: 100, height: 4, backgroundColor: '#000000' })} className="p-2 hover:bg-gray-100 rounded" title="Line"><Minus size={16} /></button>
           </div>

           <div className="flex gap-0.5 ml-1 border-l pl-2">
             <button onClick={() => addItem('LIST', { items: ['Item 1', 'Item 2', 'Item 3'], ordered: false }, { width: 200 })} className="p-2 hover:bg-gray-100 rounded" title="Bullet List"><List size={16} /></button>
             <button onClick={() => addItem('LIST', { items: ['1. Item', '2. Item', '3. Item'], ordered: true }, { width: 200 })} className="p-2 hover:bg-gray-100 rounded" title="Numbered List"><ListOrdered size={16} /></button>
           </div>
        </div>

        {/* Templates */}
        <div className="flex gap-2 items-center shrink-0">
            <span className="text-xs font-bold text-gray-400">Templates:</span>
            <div className="flex gap-1">
                <button onClick={() => loadTemplate(0)} className="w-6 h-6 rounded bg-zinc-900 border border-gray-300 hover:scale-110 transition-transform" title="Dark" />
                <button onClick={() => loadTemplate(1)} className="w-6 h-6 rounded bg-white border border-gray-300 hover:scale-110 transition-transform" title="White" />
                <button onClick={() => loadTemplate(2)} className="w-6 h-6 rounded bg-blue-900 border border-gray-300 hover:scale-110 transition-transform" title="Blue" />
            </div>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
            
            <button 
                onClick={() => importFileRef.current?.click()} 
                className="p-1.5 hover:bg-gray-100 rounded text-gray-600" 
                title="Upload JSON Template"
            >
                <Upload size={18} />
            </button>
            <input ref={importFileRef} type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
        </div>
      </div>
    );
  };

  const renderCanvasItem = (item: CanvasItem) => {
    const isSelected = selectedItemId === item.id;
    const isBg = item.id.startsWith('bg-');
    
    const style: React.CSSProperties = {
      ...item.style,
      position: 'relative'
    };

    let content = null;
    switch(item.type) {
        case 'TEXT':
            content = <div style={style}>{item.data.text}</div>;
            break;
        case 'SHAPE':
            content = <div style={{width: '100%', height: '100%', backgroundColor: style.backgroundColor, borderRadius: style.borderRadius, border: `${style.borderWidth || 0}px solid ${style.borderColor || 'transparent'}`}} />;
            break;
        case 'IMAGE':
            content = <img src={item.data.src} alt="img" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: style.borderRadius}} />;
            break;
        case 'LIST':
             const Tag = item.data.ordered ? 'ol' : 'ul';
             content = (
                 <Tag style={{...style, paddingLeft: '1.2em', listStylePosition: 'outside', listStyleType: item.data.ordered ? 'decimal' : 'disc'}}>
                    {item.data.items.map((li: string, i: number) => <li key={i}>{li}</li>)}
                 </Tag>
             );
             break;
    }

    return (
      <div 
        key={item.id}
        onMouseDown={(e) => handleMouseDown(e, item.id)}
        style={{
            position: 'absolute', 
            left: item.x, 
            top: item.y,
            width: item.style?.width, 
            height: item.style?.height,
            cursor: isBg ? 'default' : 'move',
            zIndex: isBg ? 0 : 10
        }}
        className={`group ${isSelected ? 'ring-1 ring-brand-lime' : isBg ? '' : 'hover:ring-1 hover:ring-gray-300/50'}`}
      >
        {content}
        {/* Resize Handle (Simplified for now - just indicator) */}
        {isSelected && item.type !== 'TEXT' && !isBg && (
             <div className="absolute bottom-0 right-0 w-3 h-3 bg-brand-lime cursor-se-resize" />
        )}
      </div>
    );
  };

  if (showLayoutModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 animate-fadeIn">
        <h2 className="text-3xl font-bold text-white mb-2">Select Card Layout</h2>
        <p className="text-gray-400 mb-10">Choose how you want to design your visiting card</p>
        
        <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {/* Cancel */}
            <button 
                onClick={onBack} 
                className="w-32 h-32 md:w-40 md:h-40 bg-brand-gray border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all group shadow-xl"
            >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                    <X className="w-6 h-6 text-gray-400 group-hover:text-red-500" />
                </div>
                <span className="text-gray-300 font-medium group-hover:text-red-400">Cancel</span>
            </button>

            {/* One Sided */}
            <button 
                onClick={() => handleLayoutSelection('single')} 
                className="w-32 h-32 md:w-40 md:h-40 bg-brand-gray border border-white/10 hover:border-brand-lime hover:bg-brand-lime/5 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all group shadow-xl hover:-translate-y-2"
            >
                <div className="w-16 h-10 border-2 border-gray-500 bg-white/5 rounded group-hover:border-brand-lime group-hover:shadow-[0_0_15px_rgba(178,232,0,0.3)] transition-all"></div>
                <span className="text-gray-300 font-medium group-hover:text-brand-lime">One Sided</span>
            </button>

            {/* Both Sides */}
            <button 
                onClick={() => handleLayoutSelection('double')} 
                className="w-32 h-32 md:w-40 md:h-40 bg-brand-gray border border-white/10 hover:border-brand-lime hover:bg-brand-lime/5 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all group shadow-xl hover:-translate-y-2"
            >
                 <div className="flex flex-col gap-1.5 items-center">
                    <div className="w-16 h-10 border-2 border-gray-500 bg-white/5 rounded group-hover:border-brand-lime transition-all"></div>
                    <div className="w-16 h-10 border-2 border-gray-600 bg-white/5 rounded border-dashed group-hover:border-brand-lime/50 transition-all"></div>
                </div>
                <span className="text-gray-300 font-medium group-hover:text-brand-lime">Both Sides</span>
            </button>
        </div>
      </div>
    );
  }

  const canvasHeight = layoutMode === 'double' ? (CARD_HEIGHT * 2 + CARD_GAP) : CARD_HEIGHT;

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar Panel */}
      <div className="w-full lg:w-80 flex flex-col border-r border-white/10 bg-brand-black z-10 shadow-xl h-full flex-shrink-0">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-brand-black">
              <button onClick={onBack} className="flex items-center text-gray-400 hover:text-white transition-colors text-sm">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </button>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={saveWork} 
                  className={`flex items-center text-sm font-bold transition-colors ${saveStatus === 'saved' ? 'text-green-500' : 'text-gray-400 hover:text-white'}`}
                  title="Save layout to browser"
                >
                  <Save className="w-4 h-4 mr-2" /> 
                  {saveStatus === 'saved' ? 'Saved' : 'Save'}
                </button>
                <button 
                    onClick={handleGenerateQr} 
                    className="flex items-center text-gray-400 hover:text-brand-lime transition-colors text-sm font-bold"
                    title="Generate QR code for this card"
                >
                    <QrCode className="w-4 h-4" />
                </button>
                <button onClick={downloadCard} className="flex items-center bg-brand-lime text-black px-3 py-1.5 rounded-md text-xs font-bold hover:brightness-110">
                  <Download className="w-3 h-3 mr-1" /> PNG
                </button>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
              <h2 className="text-lg font-bold mb-2">Card Elements</h2>
              <p className="text-gray-400 text-xs mb-6">Click an element, then click on the card to place it.</p>
              
              <div className="grid grid-cols-1 gap-3">
                {SIDEBAR_TOOLS.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => handleToolSelect(tool.id)}
                    className={`flex items-center p-3 rounded-xl border transition-all duration-200 group relative overflow-hidden text-left ${
                      selectedTool === tool.id 
                        ? 'bg-brand-lime text-brand-black border-brand-lime shadow-[0_0_20px_rgba(178,232,0,0.3)]' 
                        : 'bg-brand-gray border-white/10 text-gray-300 hover:border-brand-lime/50 hover:bg-white/5'
                    }`}
                  >
                    <div className={`mr-3 p-1.5 rounded-lg ${selectedTool === tool.id ? 'bg-black/10' : 'bg-white/5'}`}>
                      {tool.icon}
                    </div>
                    <span className="font-medium text-sm">{tool.label}</span>
                    {selectedTool === tool.id && (
                       <div className="absolute right-4 animate-pulse">
                          <MousePointer2 size={16} />
                       </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                  <h3 className="text-sm font-bold text-gray-400 mb-2">Current Layout</h3>
                  <div className="flex items-center gap-2 text-xs text-brand-lime">
                     <Layout size={14} />
                     {layoutMode === 'single' ? 'One Sided Card' : 'Double Sided Card'}
                  </div>
              </div>
          </div>
      </div>

      {/* Right Panel Container */}
      <div className="flex-1 flex flex-col bg-gray-100">
          
          {/* Top Header/Toolbar */}
          {renderToolbar()}

          {/* Quick Edit Bar */}
          {selectedItem?.type === 'TEXT' && (
             <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center px-4">
                 <Type size={14} className="text-gray-400 mr-2" />
                 <input 
                   type="text" 
                   value={selectedItem.data.text} 
                   onChange={(e) => updateItemData('text', e.target.value)}
                   className="bg-transparent text-white text-sm outline-none w-full"
                   placeholder="Edit text content..."
                   autoFocus
                 />
             </div>
          )}
          
          {/* Canvas Area */}
          <div className="flex-1 overflow-auto bg-gray-200 flex items-start justify-center p-10 relative cursor-default"
               onMouseMove={handleMouseMove}
               onMouseUp={handleMouseUp}
               onClick={(e) => {
                  if (!isDragging && e.target === e.currentTarget) setSelectedItemId(null);
                  if (selectedTool && !isDragging && e.target === e.currentTarget) setSelectedTool(null);
               }}
          >
             {selectedTool && (
                <div className="fixed top-32 left-1/2 -translate-x-1/2 bg-brand-lime text-black px-4 py-2 rounded-full shadow-lg z-50 font-bold text-sm animate-bounce pointer-events-none">
                  Click on card to place {SIDEBAR_TOOLS.find(t => t.id === selectedTool)?.label}
                </div>
             )}

             <div className="relative">
                {layoutMode === 'double' && (
                    <div className="absolute -left-16 top-0 text-xs font-bold text-gray-400 flex flex-col gap-[390px]">
                        <span>FRONT</span>
                        <span>BACK</span>
                    </div>
                )}
                
                <div 
                ref={cardRef}
                id="card-canvas"
                className={`relative transition-cursor ${selectedTool ? 'cursor-crosshair' : ''}`}
                style={{
                    width: CARD_WIDTH,
                    height: canvasHeight,
                    minWidth: CARD_WIDTH,
                    minHeight: canvasHeight
                }}
                onClick={handleCanvasClick}
                >
                    {/* Render standard canvas items */}
                    {items.map(renderCanvasItem)}

                    {/* Shadow/Container Visualization for gap if double */}
                    {layoutMode === 'double' && (
                        <div className="absolute left-0 right-0 pointer-events-none border-t border-b border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400" 
                            style={{
                                top: CARD_HEIGHT, 
                                height: CARD_GAP, 
                                backgroundColor: '#e5e7eb'
                            }}>
                            Fold / Cut Line
                        </div>
                    )}
                </div>
             </div>
          </div>
      </div>

       {/* QR Code Modal */}
       {showQrModal && qrUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-brand-gray border border-white/10 rounded-2xl p-8 max-w-sm w-full relative">
                <button 
                    onClick={() => setShowQrModal(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    <X size={20} />
                </button>
                <h3 className="text-xl font-bold text-white mb-6 text-center">Card QR</h3>
                
                <div className="bg-white p-4 rounded-xl mb-6 mx-auto w-fit">
                    <QRCodeCanvas value={qrUrl} size={200} level="M" />
                </div>
                
                <p className="text-center text-xs text-gray-400 mb-6">
                    Scan to open the card image (same device only) or click below to download.
                </p>

                <a 
                    href={qrUrl} 
                    download={`Card-${layoutMode}.png`}
                    className="flex items-center justify-center w-full bg-brand-lime text-black font-bold py-3 rounded-xl hover:brightness-110 transition-all"
                >
                    <Download className="mr-2" size={18} /> Download Image
                </a>
            </div>
        </div>
      )}
    </div>
  );
};