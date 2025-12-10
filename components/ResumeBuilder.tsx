import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, Printer, Trash2, Move, Save,
  User, Phone, Briefcase, GraduationCap, FolderGit2, Wrench, X,
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight,
  Copy, Scissors, Clipboard, Image as ImageIcon, Undo, Redo,
  Type, List, ListOrdered, Minus, Circle, Square, LayoutTemplate, Grid, QrCode, Download,
  FileText, Layout, Upload, Linkedin, Github, Facebook, Instagram, Twitter
} from 'lucide-react';
import { CanvasItem, ToolType, CanvasItemStyle } from '../types';
import html2canvas from 'html2canvas';
import { QRCodeCanvas } from 'qrcode.react';

interface ResumeBuilderProps {
  onBack: () => void;
}

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const PIXELS_PER_MM = 3.78; // approx 96 DPI
const CANVAS_WIDTH = A4_WIDTH_MM * PIXELS_PER_MM;
const CANVAS_HEIGHT = A4_HEIGHT_MM * PIXELS_PER_MM;

const TOOLS: { id: ToolType; label: string; icon: React.ReactNode }[] = [
  { id: 'NAME', label: 'Header', icon: <User size={20} /> },
  { id: 'CONTACT', label: 'Contact', icon: <Phone size={20} /> },
  { id: 'EXPERIENCE', label: 'Experience', icon: <Briefcase size={20} /> },
  { id: 'EDUCATION', label: 'Education', icon: <GraduationCap size={20} /> },
  { id: 'PROJECTS', label: 'Projects', icon: <FolderGit2 size={20} /> },
  { id: 'SKILLS', label: 'Skills', icon: <Wrench size={20} /> },
  { id: 'LINKEDIN', label: 'LinkedIn', icon: <Linkedin size={20} /> },
  { id: 'GITHUB', label: 'GitHub', icon: <Github size={20} /> },
  { id: 'TWITTER', label: 'X / Twitter', icon: <Twitter size={20} /> },
  { id: 'FACEBOOK', label: 'Facebook', icon: <Facebook size={20} /> },
  { id: 'INSTAGRAM', label: 'Instagram', icon: <Instagram size={20} /> },
];

const FONTS = ['Inter', 'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana'];

const getDefaultData = (type: ToolType) => {
  switch (type) {
    case 'NAME': return { name: 'Alex Doe', role: 'Software Engineer', summary: 'Passionate developer with 5 years experience in building scalable web applications.' };
    case 'CONTACT': return { email: 'alex@example.com', phone: '+1 234 567 890', location: 'San Francisco, CA', link: 'linkedin.com/in/alex' };
    case 'EXPERIENCE': return { role: 'Senior Developer', company: 'Tech Corp', duration: '2020 - Present', description: 'Led team in rebuilding core infrastructure. Improved performance by 40%.' };
    case 'EDUCATION': return { school: 'University of Tech', degree: 'B.S. Computer Science', year: '2019' };
    case 'PROJECTS': return { name: 'E-Commerce App', link: 'github.com/alex/shop', description: 'Full stack app with React & Node. Features include cart, payment, and admin dashboard.' };
    case 'SKILLS': return { items: 'React, TypeScript, Node.js, Tailwind, Postgres, AWS' };
    case 'TEXT': return { text: 'Double click to edit text' };
    case 'LIST': return { items: ['List item 1', 'List item 2', 'List item 3'] };
    case 'SHAPE': return { shapeType: 'rectangle' };
    case 'IMAGE': return { src: '' };
    case 'LINKEDIN': return { text: 'linkedin.com/in/username', link: 'https://linkedin.com/in/username' };
    case 'GITHUB': return { text: 'github.com/username', link: 'https://github.com/username' };
    case 'TWITTER': return { text: '@username', link: 'https://x.com/username' };
    case 'FACEBOOK': return { text: 'facebook.com/username', link: 'https://facebook.com/username' };
    case 'INSTAGRAM': return { text: '@username', link: 'https://instagram.com/username' };
    default: return {};
  }
};

const getDefaultStyle = (type: ToolType): CanvasItemStyle => {
  const base = { fontSize: 14, fontFamily: 'Inter', color: '#000000', lineHeight: 1.5, textAlign: 'left' as const };
  if (type === 'SHAPE') return { ...base, width: 100, height: 100, backgroundColor: '#B2E800', borderWidth: 0 };
  if (type === 'IMAGE') return { ...base, width: 150, height: 150 };
  if (['LINKEDIN', 'GITHUB', 'TWITTER', 'FACEBOOK', 'INSTAGRAM'].includes(type)) return { ...base, fontSize: 12, color: '#374151' };
  return base;
};

export const ResumeBuilder: React.FC<ResumeBuilderProps> = ({ onBack }) => {
  // Synchronous State Initialization to prevent flicker
  const getInitialState = () => {
    const savedData = localStorage.getItem('smart-creator-resume-draft');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
            return { history: [parsed], stage: 'editor' as const };
        }
      } catch (e) {
        console.error("Error loading draft", e);
      }
    }
    return { history: [[]], stage: 'initial' as const };
  };

  const initialState = getInitialState();

  // Setup State
  const [setupStage, setSetupStage] = useState<'initial' | 'templates' | 'editor'>(initialState.stage);

  // History Management
  const [history, setHistory] = useState<CanvasItem[][]>(initialState.history);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  // QR Modal State
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const items = history[historyIndex];
  
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

  const saveWork = () => {
    localStorage.setItem('smart-creator-resume-draft', JSON.stringify(items));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
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

  const handleGenerateQr = async () => {
    const canvasElement = document.getElementById('canvas-area');
    if (canvasElement) {
        // Temporarily deselect items to hide handles
        const prevSelection = selectedItemId;
        setSelectedItemId(null);
        
        // Short delay to allow React to render deselection
        setTimeout(async () => {
            try {
                const canvas = await html2canvas(canvasElement, { scale: 2 });
                canvas.toBlob((blob) => {
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        setQrUrl(url);
                        setShowQrModal(true);
                        // Restore selection
                        if (prevSelection) setSelectedItemId(prevSelection);
                    }
                });
            } catch (error) {
                console.error("Failed to generate QR blob", error);
            }
        }, 100);
    }
  };

  const [selectedTool, setSelectedTool] = useState<ToolType | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<CanvasItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  
  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const dragItemRef = useRef<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const selectedItem = items.find(i => i.id === selectedItemId);

  // --- Toolbar Actions ---

  const updateItemStyle = (updates: Partial<CanvasItemStyle>) => {
    if (!selectedItemId) return;
    const newItems = items.map(item => 
      item.id === selectedItemId 
        ? { ...item, style: { ...item.style, ...updates } }
        : item
    );
    setItems(newItems);
  };

  const updateItemData = (id: string, field: string, value: any) => {
    const newItems = items.map(item => 
      item.id === id ? { ...item, data: { ...item.data, [field]: value } } : item
    );
    setItems(newItems);
  };

  const handleCopy = () => {
    if (selectedItem) setClipboard(selectedItem);
  };

  const handleCut = () => {
    if (selectedItem) {
      setClipboard(selectedItem);
      const newItems = items.filter(i => i.id !== selectedItemId);
      setItems(newItems);
      setSelectedItemId(null);
    }
  };

  const handlePaste = () => {
    if (clipboard) {
      const newItem = {
        ...clipboard,
        id: Date.now().toString(),
        x: clipboard.x + 20,
        y: clipboard.y + 20
      };
      setItems([...items, newItem]);
      setSelectedItemId(newItem.id);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        const newItem: CanvasItem = {
          id: Date.now().toString(),
          type: 'IMAGE',
          x: 50,
          y: 50,
          data: { src },
          style: getDefaultStyle('IMAGE')
        };
        setItems([...items, newItem]);
        setSelectedItemId(newItem.id);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
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
                      if (Array.isArray(parsed)) {
                          setItems(parsed);
                          setSetupStage('editor');
                      } else {
                          alert("Invalid template file format.");
                      }
                  }
              } catch (error) {
                  console.error("Error parsing JSON", error);
                  alert("Failed to load template. Invalid JSON.");
              }
          };
          reader.readAsText(file);
      }
      if (importFileRef.current) importFileRef.current.value = '';
  };

  const addShape = (shapeType: 'rectangle' | 'circle' | 'line') => {
    const newItem: CanvasItem = {
      id: Date.now().toString(),
      type: 'SHAPE',
      x: 50,
      y: 50,
      data: { shapeType },
      style: {
        ...getDefaultStyle('SHAPE'),
        borderRadius: shapeType === 'circle' ? 9999 : 0,
        height: shapeType === 'line' ? 2 : 100,
        backgroundColor: shapeType === 'line' ? '#000000' : '#B2E800'
      }
    };
    setItems([...items, newItem]);
    setSelectedItemId(newItem.id);
  };

  const addList = (ordered: boolean) => {
    const newItem: CanvasItem = {
      id: Date.now().toString(),
      type: 'LIST',
      x: 50,
      y: 50,
      data: { items: ['List item 1', 'List item 2', 'List item 3'], ordered },
      style: getDefaultStyle('LIST')
    };
    setItems([...items, newItem]);
    setSelectedItemId(newItem.id);
  };

  const loadResumeTemplate = (index: number) => {
    let templateItems: CanvasItem[] = [];

    if (index === 0) {
        // Modern Clean - Two Column, Accents
        templateItems = [
            // Header
            { id: '1', type: 'NAME', x: 40, y: 40, data: getDefaultData('NAME'), style: { ...getDefaultStyle('NAME'), fontSize: 28, fontWeight: 'bold' } },
            { id: '2', type: 'CONTACT', x: 40, y: 110, data: getDefaultData('CONTACT'), style: { ...getDefaultStyle('CONTACT'), fontSize: 12 } },
            { id: '3', type: 'SHAPE', x: 40, y: 150, data: { shapeType: 'line' }, style: { ...getDefaultStyle('SHAPE'), width: 700, height: 4, backgroundColor: '#B2E800' } },
            
            // Left Column (Skills & Ed)
            { id: '4', type: 'TEXT', x: 40, y: 180, data: { text: 'SKILLS' }, style: { ...getDefaultStyle('TEXT'), fontSize: 16, fontWeight: 'bold', color: '#B2E800' } },
            { id: '5', type: 'SKILLS', x: 40, y: 210, data: getDefaultData('SKILLS'), style: { ...getDefaultStyle('SKILLS'), width: 250 } },
            { id: '6', type: 'TEXT', x: 40, y: 350, data: { text: 'EDUCATION' }, style: { ...getDefaultStyle('TEXT'), fontSize: 16, fontWeight: 'bold', color: '#B2E800' } },
            { id: '7', type: 'EDUCATION', x: 40, y: 380, data: getDefaultData('EDUCATION'), style: { ...getDefaultStyle('EDUCATION'), width: 250 } },

            // Right Column (Experience)
            { id: '8', type: 'TEXT', x: 320, y: 180, data: { text: 'EXPERIENCE' }, style: { ...getDefaultStyle('TEXT'), fontSize: 16, fontWeight: 'bold', color: '#B2E800' } },
            { id: '9', type: 'EXPERIENCE', x: 320, y: 210, data: getDefaultData('EXPERIENCE'), style: { ...getDefaultStyle('EXPERIENCE'), width: 400 } },
            { id: '10', type: 'EXPERIENCE', x: 320, y: 350, data: { ...getDefaultData('EXPERIENCE'), role: 'Junior Developer', company: 'Startup Inc', duration: '2018 - 2020' }, style: { ...getDefaultStyle('EXPERIENCE'), width: 400 } },
        ];
    } else if (index === 1) {
        // Professional - Left Sidebar
        templateItems = [
             // Sidebar Background
             { id: 'bg1', type: 'SHAPE', x: 0, y: 0, data: { shapeType: 'rectangle' }, style: { ...getDefaultStyle('SHAPE'), width: 240, height: CANVAS_HEIGHT, backgroundColor: '#1f2937', borderWidth: 0 } },
             
             // Sidebar Content
             { id: '1', type: 'NAME', x: 20, y: 40, data: getDefaultData('NAME'), style: { ...getDefaultStyle('NAME'), fontSize: 24, fontWeight: 'bold', color: 'white' } },
             { id: '2', type: 'CONTACT', x: 20, y: 200, data: getDefaultData('CONTACT'), style: { ...getDefaultStyle('CONTACT'), fontSize: 11, color: '#9ca3af' } },
             { id: '3', type: 'TEXT', x: 20, y: 350, data: { text: 'SKILLS' }, style: { ...getDefaultStyle('TEXT'), fontSize: 14, fontWeight: 'bold', color: 'white', letterSpacing: '2px' } },
             { id: '4', type: 'SKILLS', x: 20, y: 380, data: getDefaultData('SKILLS'), style: { ...getDefaultStyle('SKILLS'), width: 200, color: 'white' } },

             // Main Content
             { id: '5', type: 'TEXT', x: 280, y: 40, data: { text: 'WORK EXPERIENCE' }, style: { ...getDefaultStyle('TEXT'), fontSize: 18, fontWeight: 'bold', color: '#374151', letterSpacing: '1px', borderBottom: '2px solid #374151', width: 450 } },
             { id: '6', type: 'EXPERIENCE', x: 280, y: 90, data: getDefaultData('EXPERIENCE'), style: { ...getDefaultStyle('EXPERIENCE'), width: 450 } },
             { id: '7', type: 'EXPERIENCE', x: 280, y: 250, data: { ...getDefaultData('EXPERIENCE'), role: 'Junior Developer', duration: '2018-2020' }, style: { ...getDefaultStyle('EXPERIENCE'), width: 450 } },
             { id: '8', type: 'TEXT', x: 280, y: 400, data: { text: 'PROJECTS' }, style: { ...getDefaultStyle('TEXT'), fontSize: 18, fontWeight: 'bold', color: '#374151', letterSpacing: '1px', borderBottom: '2px solid #374151', width: 450 } },
             { id: '9', type: 'PROJECTS', x: 280, y: 450, data: getDefaultData('PROJECTS'), style: { ...getDefaultStyle('PROJECTS'), width: 450 } },
        ];
    } else if (index === 2) {
        // Simple Classic
        templateItems = [
             { id: '1', type: 'NAME', x: 0, y: 40, data: getDefaultData('NAME'), style: { ...getDefaultStyle('NAME'), fontSize: 32, fontWeight: 'bold', textAlign: 'center', width: CANVAS_WIDTH } },
             { id: '2', type: 'CONTACT', x: 0, y: 120, data: getDefaultData('CONTACT'), style: { ...getDefaultStyle('CONTACT'), fontSize: 12, textAlign: 'center', width: CANVAS_WIDTH } },
             { id: '3', type: 'SHAPE', x: 40, y: 160, data: { shapeType: 'line' }, style: { ...getDefaultStyle('SHAPE'), width: 700, height: 1, backgroundColor: '#000000' } },
             
             { id: '4', type: 'TEXT', x: 40, y: 180, data: { text: 'Professional Experience' }, style: { ...getDefaultStyle('TEXT'), fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' } },
             { id: '5', type: 'EXPERIENCE', x: 40, y: 210, data: getDefaultData('EXPERIENCE'), style: { ...getDefaultStyle('EXPERIENCE'), width: 700 } },
             { id: '6', type: 'EXPERIENCE', x: 40, y: 340, data: { ...getDefaultData('EXPERIENCE'), role: 'Developer' }, style: { ...getDefaultStyle('EXPERIENCE'), width: 700 } },

             { id: '7', type: 'TEXT', x: 40, y: 480, data: { text: 'Education' }, style: { ...getDefaultStyle('TEXT'), fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' } },
             { id: '8', type: 'EDUCATION', x: 40, y: 510, data: getDefaultData('EDUCATION'), style: { ...getDefaultStyle('EDUCATION'), width: 700 } },
        ];
    } else {
        // Blank
        templateItems = [];
    }

    setItems(templateItems);
    setSetupStage('editor');
  };

  const loadTemplate = () => {
    setSetupStage('templates');
  };

  // --- Canvas Interaction ---

  const handleToolSelect = (tool: ToolType) => {
    setSelectedTool(tool);
    setSelectedItemId(null);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedTool && !isDragging) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newItem: CanvasItem = {
        id: Date.now().toString(),
        type: selectedTool,
        x: Math.min(Math.max(0, x - 100), CANVAS_WIDTH - 200),
        y: Math.min(Math.max(0, y - 20), CANVAS_HEIGHT - 50),
        data: getDefaultData(selectedTool),
        style: getDefaultStyle(selectedTool)
      };

      setItems([...items, newItem]);
      setSelectedTool(null);
      setSelectedItemId(newItem.id);
    } else {
      if (!isDragging && (e.target as HTMLElement).id === 'canvas-area') {
         setSelectedItemId(null);
      }
    }
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
    setSelectedItemId(null);
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
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
        item.id === dragItemRef.current 
          ? { ...item, x, y } 
          : item
      );
      
      // Update state without history for smooth dragging
      const tempHistory = [...history];
      tempHistory[historyIndex] = newItems;
      setHistory(tempHistory);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      const currentItems = history[historyIndex];
      setItems(currentItems, true); // Commit drag end to history
    }
    setIsDragging(false);
    dragItemRef.current = null;
  };

  // --- Renderers ---

  const renderToolbar = () => {
    const s = selectedItem?.style || {};
    const hasSelection = !!selectedItem;

    return (
      <div className="h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-2 overflow-x-auto shadow-sm z-20 text-gray-900 select-none whitespace-nowrap">
        
        {/* Undo / Redo */}
        <div className="flex gap-1 pr-2 border-r border-gray-200 shrink-0">
           <button onClick={undo} disabled={historyIndex === 0} className="p-2 hover:bg-gray-100 rounded disabled:opacity-30" title="Undo"><Undo size={18} /></button>
           <button onClick={redo} disabled={historyIndex === history.length - 1} className="p-2 hover:bg-gray-100 rounded disabled:opacity-30" title="Redo"><Redo size={18} /></button>
        </div>

        {/* Font Controls */}
        <div className="flex gap-2 items-center pr-2 border-r border-gray-200 shrink-0">
           <select 
             value={s.fontFamily || 'Inter'} 
             onChange={(e) => updateItemStyle({ fontFamily: e.target.value })}
             className="w-28 border rounded px-2 py-1 text-sm bg-transparent text-gray-900"
             disabled={!hasSelection}
           >
             {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
           </select>
           <input 
             type="number" 
             value={s.fontSize || 14} 
             onChange={(e) => updateItemStyle({ fontSize: parseInt(e.target.value) })}
             className="w-14 border rounded px-2 py-1 text-sm text-center text-gray-900"
             disabled={!hasSelection}
             title="Font Size"
           />
           <input
             type="number"
             value={s.lineHeight || 1.5}
             step="0.1"
             onChange={(e) => updateItemStyle({ lineHeight: parseFloat(e.target.value) })}
             className="w-14 border rounded px-2 py-1 text-sm text-center text-gray-900"
             disabled={!hasSelection}
             title="Line Height"
           />
        </div>

        {/* Style Toggles */}
        <div className="flex gap-1 pr-2 border-r border-gray-200 shrink-0">
          <button onClick={() => updateItemStyle({ fontWeight: s.fontWeight === 'bold' ? 'normal' : 'bold' })} disabled={!hasSelection} className={`p-2 rounded ${s.fontWeight === 'bold' ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="Bold"><Bold size={18} /></button>
          <button onClick={() => updateItemStyle({ fontStyle: s.fontStyle === 'italic' ? 'normal' : 'italic' })} disabled={!hasSelection} className={`p-2 rounded ${s.fontStyle === 'italic' ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="Italic"><Italic size={18} /></button>
          <button onClick={() => updateItemStyle({ textDecoration: s.textDecoration === 'underline' ? 'none' : 'underline' })} disabled={!hasSelection} className={`p-2 rounded ${s.textDecoration === 'underline' ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="Underline"><Underline size={18} /></button>
          <button onClick={() => updateItemStyle({ textDecoration: s.textDecoration === 'line-through' ? 'none' : 'line-through' })} disabled={!hasSelection} className={`p-2 rounded ${s.textDecoration === 'line-through' ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="Strikethrough"><Strikethrough size={18} /></button>
        </div>

        {/* Colors (RGB) */}
        <div className="flex items-center gap-2 pr-2 border-r border-gray-200 shrink-0">
            <div className={`flex flex-col items-center group relative ${!hasSelection ? 'opacity-40 pointer-events-none' : ''}`}>
                <label className="text-[9px] text-gray-500 uppercase font-bold">Text</label>
                 <input
                     type="color"
                     value={s.color || '#000000'}
                     onChange={(e) => updateItemStyle({ color: e.target.value })}
                     className="w-6 h-6 rounded cursor-pointer border border-gray-300 p-0 overflow-hidden"
                     title="Text Color (RGB)"
                 />
            </div>
            <div className={`flex flex-col items-center group relative ${!hasSelection ? 'opacity-40 pointer-events-none' : ''}`}>
                <label className="text-[9px] text-gray-500 uppercase font-bold">BG</label>
                 <input
                     type="color"
                     value={s.backgroundColor || '#ffffff'}
                     onChange={(e) => updateItemStyle({ backgroundColor: e.target.value })}
                     className="w-6 h-6 rounded cursor-pointer border border-gray-300 p-0 overflow-hidden"
                     title="Background Color (RGB)"
                 />
            </div>
        </div>

        {/* Alignment */}
        <div className="flex gap-1 pr-2 border-r border-gray-200 shrink-0">
          <button onClick={() => updateItemStyle({ textAlign: 'left' })} disabled={!hasSelection} className={`p-2 rounded ${s.textAlign === 'left' ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="Align Left"><AlignLeft size={18} /></button>
          <button onClick={() => updateItemStyle({ textAlign: 'center' })} disabled={!hasSelection} className={`p-2 rounded ${s.textAlign === 'center' ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="Align Center"><AlignCenter size={18} /></button>
          <button onClick={() => updateItemStyle({ textAlign: 'right' })} disabled={!hasSelection} className={`p-2 rounded ${s.textAlign === 'right' ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="Align Right"><AlignRight size={18} /></button>
        </div>

        {/* Clipboard */}
        <div className="flex gap-1 pr-2 border-r border-gray-200 shrink-0">
           <button onClick={handleCopy} disabled={!hasSelection} className="p-2 hover:bg-gray-100 rounded" title="Copy"><Copy size={18} /></button>
           <button onClick={handleCut} disabled={!hasSelection} className="p-2 hover:bg-gray-100 rounded" title="Cut"><Scissors size={18} /></button>
           <button onClick={handlePaste} disabled={!clipboard} className="p-2 hover:bg-gray-100 rounded" title="Paste"><Clipboard size={18} /></button>
        </div>

        {/* Insert Objects */}
        <div className="flex gap-2 items-center shrink-0">
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded text-sm" title="Insert Image">
            <ImageIcon size={18} />
          </button>
          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <div className="flex gap-1">
             <button onClick={() => addShape('rectangle')} className="p-2 hover:bg-gray-100 rounded" title="Square"><Square size={18} /></button>
             <button onClick={() => addShape('circle')} className="p-2 hover:bg-gray-100 rounded" title="Circle"><Circle size={18} /></button>
             <button onClick={() => addShape('line')} className="p-2 hover:bg-gray-100 rounded" title="Line"><Minus size={18} /></button>
          </div>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <div className="flex gap-1">
             <button onClick={() => addList(false)} className="p-2 hover:bg-gray-100 rounded" title="Bullet List"><List size={18} /></button>
             <button onClick={() => addList(true)} className="p-2 hover:bg-gray-100 rounded" title="Numbered List"><ListOrdered size={18} /></button>
          </div>
        </div>

        <div className="flex-1" />

        <div className="shrink-0">
            <button 
            onClick={() => importFileRef.current?.click()} 
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-800 rounded-md text-sm font-medium text-brand-lime bg-black border border-brand-lime/50 transition-all hover:shadow-[0_0_10px_rgba(178,232,0,0.2)] whitespace-nowrap"
            >
                <Upload size={16} /> 
                Upload Template
            </button>
            <input ref={importFileRef} type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
        </div>
      </div>
    );
  };

  const renderEditor = () => {
    if (!selectedItem) return null;
    const { type, data } = selectedItem;

    if (type === 'SHAPE' || type === 'IMAGE') return (
      <div className="p-4 text-center text-gray-400">Use toolbar to edit style or resize on canvas.</div>
    );

    return (
      <div className="space-y-4 animate-fadeIn">
        <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            Edit {type}
          </h3>
          <button onClick={() => removeItem(selectedItem.id)} className="text-red-400 hover:text-red-300 p-2 rounded hover:bg-white/5">
            <Trash2 size={18} />
          </button>
        </div>

        {type === 'NAME' && (
          <>
            <Input label="Full Name" value={data.name} onChange={v => updateItemData(selectedItem.id, 'name', v)} />
            <Input label="Role Title" value={data.role} onChange={v => updateItemData(selectedItem.id, 'role', v)} />
            <InputArea label="Summary" value={data.summary} onChange={v => updateItemData(selectedItem.id, 'summary', v)} />
          </>
        )}
        {type === 'CONTACT' && (
          <>
             <Input label="Email" value={data.email} onChange={v => updateItemData(selectedItem.id, 'email', v)} />
             <Input label="Phone" value={data.phone} onChange={v => updateItemData(selectedItem.id, 'phone', v)} />
             <Input label="Location" value={data.location} onChange={v => updateItemData(selectedItem.id, 'location', v)} />
             <Input label="Link" value={data.link} onChange={v => updateItemData(selectedItem.id, 'link', v)} />
          </>
        )}
        {type === 'EXPERIENCE' && (
           <>
             <Input label="Role" value={data.role} onChange={v => updateItemData(selectedItem.id, 'role', v)} />
             <Input label="Company" value={data.company} onChange={v => updateItemData(selectedItem.id, 'company', v)} />
             <Input label="Duration" value={data.duration} onChange={v => updateItemData(selectedItem.id, 'duration', v)} />
             <InputArea label="Description" value={data.description} onChange={v => updateItemData(selectedItem.id, 'description', v)} />
           </>
        )}
        {type === 'EDUCATION' && (
           <>
             <Input label="School" value={data.school} onChange={v => updateItemData(selectedItem.id, 'school', v)} />
             <Input label="Degree" value={data.degree} onChange={v => updateItemData(selectedItem.id, 'degree', v)} />
             <Input label="Year" value={data.year} onChange={v => updateItemData(selectedItem.id, 'year', v)} />
           </>
        )}
        {type === 'PROJECTS' && (
           <>
             <Input label="Project Name" value={data.name} onChange={v => updateItemData(selectedItem.id, 'name', v)} />
             <Input label="Link" value={data.link} onChange={v => updateItemData(selectedItem.id, 'link', v)} />
             <InputArea label="Description" value={data.description} onChange={v => updateItemData(selectedItem.id, 'description', v)} />
           </>
        )}
        {type === 'SKILLS' && (
           <Input label="Skills (comma separated)" value={data.items} onChange={v => updateItemData(selectedItem.id, 'items', v)} />
        )}
        {(['LINKEDIN', 'GITHUB', 'TWITTER', 'FACEBOOK', 'INSTAGRAM'].includes(type)) && (
           <>
             <Input label="Display Text" value={data.text} onChange={v => updateItemData(selectedItem.id, 'text', v)} />
             <Input label="URL (Optional)" value={data.link} onChange={v => updateItemData(selectedItem.id, 'link', v)} />
           </>
        )}
        {type === 'LIST' && (
           <div className="space-y-2">
             <label className="text-xs text-gray-400">List Items</label>
             {data.items.map((item: string, idx: number) => (
                <div key={idx} className="flex gap-2">
                  <input 
                    className="flex-1 bg-brand-gray border border-white/20 rounded p-2 text-sm text-white"
                    value={item}
                    onChange={(e) => {
                      const newItems = [...data.items];
                      newItems[idx] = e.target.value;
                      updateItemData(selectedItem.id, 'items', newItems);
                    }}
                  />
                  <button onClick={() => {
                     const newItems = data.items.filter((_: any, i: number) => i !== idx);
                     updateItemData(selectedItem.id, 'items', newItems);
                  }} className="text-red-400"><X size={14} /></button>
                </div>
             ))}
             <button 
               onClick={() => updateItemData(selectedItem.id, 'items', [...data.items, 'New Item'])}
               className="text-xs text-brand-lime hover:underline"
             >+ Add Item</button>
           </div>
        )}

        <button 
          onClick={() => setSelectedItemId(null)}
          className="w-full mt-4 bg-brand-lime text-black font-bold py-2 rounded hover:brightness-110 transition-all"
        >
          Done Editing
        </button>
      </div>
    );
  };

  const renderCanvasItem = (item: CanvasItem) => {
    const isSelected = selectedItemId === item.id;
    const style: React.CSSProperties = {
      ...item.style,
      position: 'relative' // Override absolute from parent for inner content flow
    };
    
    // Wrapper Style (Positioning)
    const wrapperStyle: React.CSSProperties = {
      left: item.x,
      top: item.y,
      width: item.style?.width,
      height: item.style?.height,
      zIndex: item.id.startsWith('bg') ? 0 : 10
    };

    let content = null;
    switch(item.type) {
      case 'NAME':
        content = (
          <div style={style}>
            <h1 style={{fontSize: '2.5em', fontWeight: 'bold', lineHeight: 1.1}}>{item.data.name}</h1>
            <h2 style={{fontSize: '1.2em', opacity: 0.8, marginBottom: '0.5em'}}>{item.data.role}</h2>
            <p style={{fontSize: '0.9em', opacity: 0.7}}>{item.data.summary}</p>
          </div>
        );
        break;
      case 'CONTACT':
        content = (
          <div style={style} className="flex flex-wrap gap-3 text-xs py-2">
             {item.data.email && <span>{item.data.email}</span>}
             {item.data.phone && <span className="opacity-70">| {item.data.phone}</span>}
             {item.data.location && <span className="opacity-70">| {item.data.location}</span>}
             {item.data.link && <span className="opacity-70">| {item.data.link}</span>}
          </div>
        );
        break;
      case 'EXPERIENCE':
        content = (
          <div style={style}>
             <div className="flex justify-between items-baseline mb-1">
                <h4 style={{fontWeight: 'bold', fontSize: '1.1em'}}>{item.data.role}</h4>
                <span style={{fontSize: '0.8em', opacity: 0.7, backgroundColor: '#f3f4f6', padding: '0 4px', color: 'black'}}>{item.data.duration}</span>
             </div>
             <div style={{fontSize: '0.9em', fontWeight: 500, marginBottom: '0.25em'}}>{item.data.company}</div>
             <p style={{fontSize: '0.9em', opacity: 0.8}}>{item.data.description}</p>
          </div>
        );
        break;
      case 'EDUCATION':
        content = (
           <div style={style}>
             <div className="flex justify-between items-baseline">
                <h4 style={{fontWeight: 'bold'}}>{item.data.school}</h4>
                <span style={{fontSize: '0.8em', opacity: 0.7}}>{item.data.year}</span>
             </div>
             <div style={{fontSize: '0.9em'}}>{item.data.degree}</div>
          </div>
        );
        break;
      case 'PROJECTS':
        content = (
           <div style={{...style, borderLeft: `3px solid ${style.color || '#B2E800'}`, paddingLeft: '8px'}}>
             <div className="flex justify-between items-baseline mb-1">
                <h4 style={{fontWeight: 'bold'}}>{item.data.name}</h4>
                {item.data.link && <span style={{fontSize: '0.8em', textDecoration: 'underline', color: 'blue'}}>{item.data.link}</span>}
             </div>
             <p style={{fontSize: '0.9em', opacity: 0.8}}>{item.data.description}</p>
          </div>
        );
        break;
      case 'SKILLS':
         content = (
           <div style={style}>
             <h4 style={{fontSize: '0.75em', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.5, marginBottom: '0.5em'}}>Skills</h4>
             <div className="flex flex-wrap gap-2">
               {item.data.items.split(',').map((skill: string, i: number) => (
                 <span key={i} style={{fontSize: '0.8em', backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e5e7eb', color: 'black'}}>
                   {skill.trim()}
                 </span>
               ))}
             </div>
           </div>
         );
         break;
      case 'SHAPE':
         content = (
           <div style={{
             width: '100%', height: '100%', 
             backgroundColor: style.backgroundColor,
             border: `${style.borderWidth || 0}px solid ${style.borderColor || 'black'}`,
             borderRadius: style.borderRadius
           }} />
         );
         break;
      case 'IMAGE':
         content = (
           <img src={item.data.src} alt="Upload" style={{width: '100%', height: '100%', objectFit: 'cover', ...style}} />
         );
         break;
      case 'TEXT':
         content = <div style={style}>{item.data.text}</div>;
         break;
      case 'LIST':
         const ListTag = item.data.ordered ? 'ol' : 'ul';
         content = (
            <div style={style}>
               <ListTag style={{listStylePosition: 'inside', listStyleType: item.data.ordered ? 'decimal' : 'disc', paddingLeft: '1em'}}>
                 {item.data.items.map((li: string, i: number) => <li key={i}>{li}</li>)}
               </ListTag>
            </div>
         );
         break;
      case 'LINKEDIN':
      case 'GITHUB':
      case 'TWITTER':
      case 'FACEBOOK':
      case 'INSTAGRAM':
         let Icon = User;
         if (item.type === 'LINKEDIN') Icon = Linkedin;
         if (item.type === 'GITHUB') Icon = Github;
         if (item.type === 'TWITTER') Icon = Twitter;
         if (item.type === 'FACEBOOK') Icon = Facebook;
         if (item.type === 'INSTAGRAM') Icon = Instagram;
         
         content = (
           <div style={{ ...style, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icon size={style.fontSize ? style.fontSize * 1.2 : 16} />
              <span>{item.data.text}</span>
           </div>
         );
         break;
    }

    return (
      <div 
        key={item.id}
        onMouseDown={(e) => handleMouseDown(e, item.id)}
        style={wrapperStyle}
        className={`absolute cursor-move group transition-shadow rounded-sm ${isSelected ? 'ring-2 ring-brand-lime z-50 bg-blue-50/10' : 'hover:ring-1 hover:ring-gray-300'}`}
      >
        <div className="relative min-w-[50px] min-h-[10px] h-full">
           {isSelected && (
              <div className="absolute -top-3 -right-3 bg-brand-lime text-black rounded-full p-1 opacity-100 shadow-sm cursor-pointer hover:bg-red-500 hover:text-white transition-colors z-50"
                onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
              >
                <X size={12} />
              </div>
           )}
           {content}
        </div>
      </div>
    );
  };

  if (setupStage === 'initial') {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 animate-fadeIn">
        <h2 className="text-3xl font-bold text-white mb-2">Create New Resume</h2>
        <p className="text-gray-400 mb-10">Start fresh or use a professional template</p>
        
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

            {/* Blank */}
            <button 
                onClick={() => { setItems([]); setSetupStage('editor'); }}
                className="w-32 h-32 md:w-40 md:h-40 bg-brand-gray border border-white/10 hover:border-brand-lime hover:bg-brand-lime/5 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all group shadow-xl hover:-translate-y-2"
            >
                <div className="w-16 h-20 bg-white rounded border border-gray-300 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all"></div>
                <span className="text-gray-300 font-medium group-hover:text-white">Blank</span>
            </button>

            {/* Templates */}
            <button 
                onClick={() => setSetupStage('templates')} 
                className="w-32 h-32 md:w-40 md:h-40 bg-brand-gray border border-white/10 hover:border-brand-lime hover:bg-brand-lime/5 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all group shadow-xl hover:-translate-y-2"
            >
                 <div className="flex gap-1 items-center">
                    <LayoutTemplate className="w-8 h-8 text-gray-500 group-hover:text-brand-lime transition-colors" />
                </div>
                <span className="text-gray-300 font-medium group-hover:text-brand-lime">Templates</span>
            </button>
        </div>
      </div>
    );
  }

  if (setupStage === 'templates') {
    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 animate-fadeIn">
            <div className="w-full max-w-5xl">
                <button onClick={() => setSetupStage('initial')} className="mb-8 text-gray-400 hover:text-white flex items-center gap-2">
                    <ArrowLeft size={20} /> Back
                </button>
                
                <h2 className="text-3xl font-bold text-white mb-8 text-center">Select a Template</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Modern Clean */}
                    <div onClick={() => loadResumeTemplate(0)} className="group cursor-pointer">
                        <div className="bg-white aspect-[210/297] rounded-lg mb-4 overflow-hidden relative shadow-lg group-hover:shadow-brand-lime/20 border-4 border-transparent group-hover:border-brand-lime transition-all">
                             {/* Preview Illustration */}
                             <div className="absolute top-4 left-4 right-4 h-8 bg-gray-200" />
                             <div className="absolute top-16 left-4 right-4 h-1 bg-brand-lime" />
                             <div className="absolute top-20 left-4 w-1/3 bottom-4 bg-gray-50" />
                             <div className="absolute top-20 right-4 w-1/2 bottom-4 bg-gray-50" />
                        </div>
                        <h3 className="text-center font-bold text-xl group-hover:text-brand-lime">Modern Clean</h3>
                        <p className="text-center text-gray-500 text-sm">Two-column with accent lines</p>
                    </div>

                    {/* Professional */}
                    <div onClick={() => loadResumeTemplate(1)} className="group cursor-pointer">
                        <div className="bg-white aspect-[210/297] rounded-lg mb-4 overflow-hidden relative shadow-lg group-hover:shadow-brand-lime/20 border-4 border-transparent group-hover:border-brand-lime transition-all">
                             <div className="absolute top-0 left-0 bottom-0 w-1/3 bg-gray-800" />
                             <div className="absolute top-4 right-4 left-[36%] h-8 bg-gray-200" />
                             <div className="absolute top-16 right-4 left-[36%] h-px bg-gray-300" />
                             <div className="absolute top-20 right-4 left-[36%] bottom-4 bg-gray-50" />
                        </div>
                        <h3 className="text-center font-bold text-xl group-hover:text-brand-lime">Professional</h3>
                        <p className="text-center text-gray-500 text-sm">Dark sidebar & structured content</p>
                    </div>

                    {/* Simple Classic */}
                    <div onClick={() => loadResumeTemplate(2)} className="group cursor-pointer">
                        <div className="bg-white aspect-[210/297] rounded-lg mb-4 overflow-hidden relative shadow-lg group-hover:shadow-brand-lime/20 border-4 border-transparent group-hover:border-brand-lime transition-all">
                             <div className="absolute top-8 left-1/2 -translate-x-1/2 w-1/2 h-6 bg-gray-200" />
                             <div className="absolute top-20 left-4 right-4 h-px bg-black" />
                             <div className="absolute top-24 left-4 right-4 h-4 bg-gray-100" />
                             <div className="absolute top-32 left-4 right-4 bottom-4 bg-gray-50" />
                        </div>
                        <h3 className="text-center font-bold text-xl group-hover:text-brand-lime">Simple Classic</h3>
                        <p className="text-center text-gray-500 text-sm">Centered header & clean dividers</p>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar Panel */}
      <div className="w-full lg:w-80 flex flex-col border-r border-white/10 bg-brand-black z-10 shadow-xl h-full flex-shrink-0">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-brand-black">
          <button onClick={onBack} className="flex items-center text-gray-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </button>
          
          <div className="flex items-center gap-3">
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
                title="Generate QR code for this resume"
            >
                <QrCode className="w-4 h-4" />
            </button>
            <button onClick={() => window.print()} className="flex items-center text-brand-lime hover:text-white transition-colors text-sm font-bold">
                <Printer className="w-4 h-4 mr-2" /> PDF
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!selectedItem ? (
            <div className="animate-fadeIn">
                <>
                <h2 className="text-lg font-bold mb-2">Add Content</h2>
                <p className="text-gray-400 text-xs mb-6">Click a block below, then click on the canvas to place it.</p>
                
                <div className="grid grid-cols-1 gap-3">
                    {TOOLS.map((tool) => (
                    <button
                        key={tool.id}
                        onClick={() => handleToolSelect(tool.id)}
                        className={`flex items-center p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden ${
                        selectedTool === tool.id 
                            ? 'bg-brand-lime text-brand-black border-brand-lime shadow-[0_0_20px_rgba(178,232,0,0.3)]' 
                            : 'bg-brand-gray border-white/10 text-gray-300 hover:border-brand-lime/50 hover:bg-white/5'
                        }`}
                    >
                        <div className={`mr-4 p-2 rounded-lg ${selectedTool === tool.id ? 'bg-black/10' : 'bg-white/5'}`}>
                        {tool.icon}
                        </div>
                        <span className="font-bold">{tool.label}</span>
                        {selectedTool === tool.id && (
                        <div className="absolute right-4 animate-pulse">
                            <Move size={16} />
                        </div>
                        )}
                    </button>
                    ))}
                </div>
                </>
            </div>
          ) : (
            renderEditor()
          )}
        </div>
      </div>

      {/* Right Panel Container */}
      <div className="flex-1 flex flex-col bg-gray-100">
        
        {/* Top Toolbar */}
        {renderToolbar()}

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto p-8 relative flex justify-center items-start cursor-default select-none">
          {selectedTool && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-brand-lime text-black px-4 py-2 rounded-full shadow-lg z-50 font-bold text-sm animate-bounce">
              Click paper to place {TOOLS.find(t => t.id === selectedTool)?.label}
            </div>
          )}

          {/* The Paper */}
          <div 
            id="canvas-area"
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ 
              width: CANVAS_WIDTH, 
              height: CANVAS_HEIGHT,
              minWidth: CANVAS_WIDTH,
              minHeight: CANVAS_HEIGHT
            }}
            className={`bg-white shadow-2xl relative transition-cursor ${selectedTool ? 'cursor-crosshair' : ''}`}
          >
            {items.length === 0 && !selectedTool && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 pointer-events-none">
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                  <p className="text-xl font-bold mb-2">Blank Canvas</p>
                  <p className="text-sm">Select a tool from the left to start.</p>
                </div>
              </div>
            )}
            {items.map(renderCanvasItem)}
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
                <h3 className="text-xl font-bold text-white mb-6 text-center">Your Resume QR</h3>
                
                <div className="bg-white p-4 rounded-xl mb-6 mx-auto w-fit">
                    <QRCodeCanvas value={qrUrl} size={200} level="M" />
                </div>
                
                <p className="text-center text-xs text-gray-400 mb-6">
                    Scan to open the resume (same device only) or click below to download.
                </p>

                <a 
                    href={qrUrl} 
                    download="Resume.png" 
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

const Input: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div className="space-y-1">
    <label className="text-xs text-gray-400 font-medium">{label}</label>
    <input 
      type="text" 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-brand-gray border border-white/20 rounded p-3 text-sm text-white focus:border-brand-lime outline-none transition-colors"
    />
  </div>
);

const InputArea: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <div className="space-y-1">
    <label className="text-xs text-gray-400 font-medium">{label}</label>
    <textarea 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-brand-gray border border-white/20 rounded p-3 text-sm text-white focus:border-brand-lime outline-none transition-colors min-h-[80px]"
    />
  </div>
);
