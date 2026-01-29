import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Medication, AppTab } from './types';
import { INITIAL_MEDICATIONS } from './constants';
import { identifyMedicationFromImage } from './geminiService';
import { 
  Search, 
  Settings, 
  Package, 
  MapPin, 
  ChevronRight, 
  Loader2,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Database,
  Heart,
  Camera
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.SEARCH);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const DEFAULT_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vReUQnXNOTsBtNzEUrODdvPKKeS3XYfhdN86nICurJbG7Cst-4SGfZujbHJgs4bvLwclmHIjtTyqpTw/pub?output=csv';

  const [medications, setMedications] = useState<Medication[]>(() => {
    const saved = localStorage.getItem('pharmacy_inventory');
    return saved ? JSON.parse(saved) : INITIAL_MEDICATIONS;
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sheetUrl, setSheetUrl] = useState(() => localStorage.getItem('pharmacy_sheet_url') || DEFAULT_URL);
  const [lastSynced, setLastSynced] = useState(() => localStorage.getItem('pharmacy_last_synced') || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);

  const headerColor = 'bg-[#004766]'; 

  const syncFromGoogleSheets = useCallback(async (isInitial: boolean = false) => {
    setIsSyncing(true);
    if (!isInitial) setSyncStatus(null);
    
    try {
      let fetchUrl = sheetUrl.trim();
      if (!fetchUrl) throw new Error('網址不能為空');
      
      if (fetchUrl.includes('docs.google.com/spreadsheets')) {
        if (fetchUrl.includes('/edit')) {
           fetchUrl = fetchUrl.split('/edit')[0] + '/export?format=csv';
        } else if (fetchUrl.includes('/pubhtml')) {
           fetchUrl = fetchUrl.replace('/pubhtml', '/pub?output=csv');
        } else if (!fetchUrl.includes('output=csv') && !fetchUrl.includes('format=csv')) {
           fetchUrl += (fetchUrl.includes('?') ? '&' : '?') + 'output=csv';
        }
      }

      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error('無法抓取資料');
      
      const csvData = await response.text();
      const cleanCsv = csvData.replace(/^\uFEFF/, '').trim();
      const lines = cleanCsv.split(/\r?\n/).filter(line => line.trim() !== '');
      if (lines.length < 1) return;
      
      const splitCSVLine = (line: string) => {
        const result = [];
        let inQuotes = false;
        let current = '';
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') inQuotes = !inQuotes;
          else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else current += char;
        }
        result.push(current.trim());
        return result.map(v => v.replace(/^"|"$/g, '').trim());
      };

      const headers = splitCSVLine(lines[0]);
      const lowerHeaders = headers.map(h => h.toLowerCase());
      
      const fieldMap = {
        location: ['儲位', '櫃', '位置', 'loc', 'place', '櫃號', '棚', '位'],
        name: ['中文', '名稱', '藥名', '品名', '商品名', 'name', 'drug', '商品名稱'],
        englishName: ['英文', 'eng', 'english', '英文名'],
        scientificName: ['學名', '成分', '成份', 'generic', 'scientific'],
        specification: ['規格', '劑量', '包裝', '容量', 'spec', 'strength']
      };

      const findIdx = (keys: string[], defaultIdx: number) => {
        const idx = lowerHeaders.findIndex(h => keys.some(k => h.toLowerCase().includes(k)));
        return idx !== -1 ? idx : defaultIdx;
      };

      const map = {
        locIdx: findIdx(fieldMap.location, 0),
        nameIdx: findIdx(fieldMap.name, 1),
        engIdx: findIdx(fieldMap.englishName, 2),
        sciIdx: findIdx(fieldMap.scientificName, 3),
        specIdx: findIdx(fieldMap.specification, 4)
      };

      const startRow = headers.some(h => ['位', '名', '藥'].some(k => h.includes(k))) ? 1 : 0;
      const dataLines = lines.slice(startRow);

      const newMeds = dataLines.map((line, index) => {
        const values = splitCSVLine(line);
        return {
          id: `med-${index}-${Date.now()}`,
          name: values[map.nameIdx] || '',
          englishName: values[map.engIdx] || '',
          scientificName: values[map.sciIdx] || '',
          specification: values[map.specIdx] || '',
          location: values[map.locIdx] || '',
          description: '', 
        };
      }).filter(m => m.name !== '' || m.location !== '');

      if (newMeds.length > 0) {
        setMedications(newMeds);
        const time = new Date().toLocaleString('zh-TW', { hour12: false });
        setLastSynced(time);
        if (!isInitial) setSyncStatus({ type: 'success', msg: `同步成功！共 ${newMeds.length} 筆資料` });
      }
    } catch (err) {
      if (!isInitial) setSyncStatus({ type: 'error', msg: '同步失敗，請確認資料源設定' });
    } finally {
      setIsSyncing(false);
    }
  }, [sheetUrl]);

  useEffect(() => {
    syncFromGoogleSheets(true);
  }, [syncFromGoogleSheets]);

  useEffect(() => {
    localStorage.setItem('pharmacy_inventory', JSON.stringify(medications));
    localStorage.setItem('pharmacy_sheet_url', sheetUrl);
    localStorage.setItem('pharmacy_last_synced', lastSynced);
  }, [medications, sheetUrl, lastSynced]);

  const handleCaptureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsIdentifying(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const result = await identifyMedicationFromImage(base64, medications);
        if (result) {
          setSearchTerm(result);
          setActiveTab(AppTab.SEARCH);
        }
        setIsIdentifying(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsIdentifying(false);
    }
  };

  const filteredMedications = medications.filter(m => {
    if (!searchTerm.trim()) return true;
    const kw = searchTerm.toLowerCase();
    return (
      m.name.toLowerCase().includes(kw) || 
      (m.englishName && m.englishName.toLowerCase().includes(kw)) ||
      (m.scientificName && m.scientificName.toLowerCase().includes(kw)) ||
      (m.specification && m.specification.toLowerCase().includes(kw)) ||
      m.location.toLowerCase().includes(kw)
    );
  });

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-white text-slate-900 overflow-hidden relative font-sans border-x border-slate-100">
      <header className={`${headerColor} text-white p-6 pt-12 shadow-lg shrink-0 z-10 rounded-b-[40px]`}>
        <div className="flex flex-col">
          <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <Database size={24} className="text-cyan-400" />
            西藥儲位快速查詢
          </h1>
          <div className="flex items-center gap-3 mt-3">
             <span className="text-[11px] font-black bg-white/10 px-3 py-0.5 rounded-full text-white/80 border border-white/5 tracking-widest uppercase">台中慈院藥學部</span>
             {lastSynced && <span className="text-[10px] opacity-40 italic font-bold">同步：{lastSynced}</span>}
             {isSyncing && <Loader2 size={10} className="animate-spin text-cyan-400 ml-1" />}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-5 pb-32 no-scrollbar bg-slate-50/30">
        {activeTab === AppTab.SEARCH && (
          <div className="space-y-6">
            <div className="relative group">
              <Search className="absolute left-5 top-5 text-slate-400 group-focus-within:text-[#004766] transition-colors" size={24} />
              <input 
                type="text" 
                placeholder="搜尋中/英/學名/商品名..." 
                className="w-full pl-14 pr-24 py-5 bg-white border-2 border-slate-100 rounded-3xl focus:ring-8 focus:ring-[#004766]/5 focus:border-[#004766] outline-none transition-all text-xl font-black text-slate-900 placeholder:text-slate-300 shadow-sm"
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
              <div className="absolute right-4 top-3 flex items-center gap-1">
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="p-2 bg-slate-100 text-slate-500 rounded-full"><X size={18} /></button>
                )}
                <button 
                  onClick={handleCaptureClick} 
                  disabled={isIdentifying || isSyncing}
                  className={`p-3 ${(isIdentifying || isSyncing) ? 'bg-slate-100' : 'bg-[#004766]'} text-white rounded-2xl shadow-md active:scale-90 transition-all`}
                >
                  {isIdentifying ? <Loader2 className="animate-spin text-slate-400" size={20} /> : <Camera size={20} />}
                </button>
                <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
              </div>
            </div>
            
            <div className="space-y-4">
              {medications.length === 0 && isSyncing ? (
                <div className="text-center py-20 flex flex-col items-center">
                   <Loader2 size={40} className="animate-spin text-[#004766] mb-4" />
                   <p className="font-black text-slate-400">正在獲取最新儲位資料...</p>
                </div>
              ) : filteredMedications.length > 0 ? filteredMedications.map(med => (
                <div key={med.id} className="p-6 rounded-[35px] border border-slate-100 shadow-[0_8px_25px_rgba(0,0,0,0.02)] flex flex-col group active:scale-[0.98] transition-all bg-white">
                  <div className="flex-1 mb-3">
                    <h3 className="font-black text-slate-900 text-2xl mb-1 leading-tight">
                      {med.name}
                      {med.specification && <span className="ml-2 text-2xl text-red-600 font-bold">{med.specification}</span>}
                    </h3>
                    {med.englishName && <span className="text-sm text-slate-400 font-black uppercase block tracking-tight">{med.englishName}</span>}
                  </div>
                  <div className="flex items-center gap-4 px-8 py-4 bg-[#004766] text-white rounded-2xl shadow-xl">
                    <MapPin size={24} className="text-cyan-300" />
                    <span className="text-5xl font-black tracking-tighter tabular-nums flex-1">{med.location || '無儲位'}</span>
                    <ChevronRight size={20} className="opacity-20" />
                  </div>
                </div>
              )) : (
                <div className="text-center py-32 text-slate-200">
                  <Package size={80} className="mx-auto opacity-10 mb-4" />
                  <p className="font-black text-xl">找不到相關藥品</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === AppTab.MANAGEMENT && (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[40px] space-y-8 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-slate-50 text-[#004766] rounded-2xl">
                   {isSyncing ? <Loader2 size={28} className="animate-spin" /> : <RefreshCw size={28} />}
                 </div>
                 <h2 className="font-black text-slate-900 text-2xl">系統維護</h2>
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Google 試算表 CSV 連結</label>
                  <input 
                    type="text" 
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-bold outline-none text-slate-900 focus:border-[#004766] transition-all"
                    placeholder="請貼上 CSV 連結..."
                    value={sheetUrl} 
                    onChange={(e) => setSheetUrl(e.target.value)} 
                  />
                </div>
                <button onClick={() => syncFromGoogleSheets(false)} disabled={isSyncing} className="w-full bg-[#004766] text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-50 text-lg">
                  {isSyncing ? <Loader2 className="animate-spin" size={24} /> : <RefreshCw size={24} />}
                  立即同步雲端資料
                </button>
                {syncStatus && (
                  <div className={`p-5 rounded-2xl text-base font-black flex items-center gap-3 ${syncStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {syncStatus.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                    <span>{syncStatus.msg}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-center pt-8 pb-12">
               <div className="flex flex-col items-center gap-2">
                 <h2 className="text-xl font-black text-slate-800 tracking-tight">台中慈濟醫院藥學部</h2>
                 <p className="text-lg font-bold text-[#004766] flex items-center gap-1">
                   <Heart size={18} className="fill-[#004766]" />
                   <span>許文馨藥師</span>
                 </p>
                 <p className="text-sm font-bold text-slate-400 mt-0.5">2026年1月製</p>
               </div>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-xl border-t border-slate-100 flex justify-around items-center px-10 pb-safe pt-4 z-50 rounded-t-[35px]">
        <button onClick={() => setActiveTab(AppTab.SEARCH)} className={`flex flex-col items-center gap-2 w-1/2 py-2 transition-all ${activeTab === AppTab.SEARCH ? 'text-[#004766] scale-110' : 'text-slate-300'}`}>
          <Search size={28} />
          <span className="text-[11px] font-black tracking-widest">儲位查詢</span>
        </button>
        <button onClick={() => setActiveTab(AppTab.MANAGEMENT)} className={`flex flex-col items-center gap-2 w-1/2 py-2 transition-all ${activeTab === AppTab.MANAGEMENT ? 'text-[#004766] scale-110' : 'text-slate-300'}`}>
          <Settings size={28} />
          <span className="text-[11px] font-black tracking-widest">系統維護</span>
        </button>
      </nav>
    </div>
  );
};

export default App;