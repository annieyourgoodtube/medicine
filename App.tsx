import React, { useState, useMemo, useEffect } from 'react';
import { MedicineRecord } from './types';
import ResultTable from './ResultTable';

const SHEET_ID = '1kd_RkujWUHfpo6SJmvicN9PrBFqK3QeZps4fHuoFdNg';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;

const App: React.FC = () => {
  const [data, setData] = useState<MedicineRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(CSV_URL);
        if (!response.ok) throw new Error('無法連線至資料庫');
        
        const csvText = await response.text();
        const rows = csvText.split('\n').map(row => {
          // 支援帶引號的 CSV 格式
          const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          return matches ? matches.map(val => val.replace(/^"|"$| /g, '')) : [];
        }).filter(row => row.length > 0);

        // 修正映射邏輯：
        // row[0] 是儲位 (例如：A101+)
        // row[1] 是藥名 (例如：大青葉)
        // row[2] 是備註/冰庫資訊
        const mappedData: MedicineRecord[] = rows.slice(1).map((row, index) => {
          const location = row[0] || ''; 
          const name = row[1] || '';     
          const fridgeInfo = row[2] || '';
          
          const isRefrigerated = fridgeInfo.includes('冰') || 
                               fridgeInfo.includes('冷') ||
                               location.includes('冰') ||
                               name.includes('冰');

          return {
            id: String(index + 1),
            name: name,
            spec: '',
            location: location,
            isRefrigerated,
            category: '',
            stock: 0,
            unit: '',
            status: ''
          };
        }).filter(item => item.location !== '' || item.name !== '');

        setData(mappedData);
      } catch (err) {
        setError('讀取失敗，請檢查網路。');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return data.filter(item => 
      item.name.toLowerCase().includes(lowerSearch) || 
      item.location.toLowerCase().includes(lowerSearch)
    );
  }, [data, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* 標題區塊 */}
      <header className="bg-emerald-800 text-white pt-12 pb-20 px-4 shadow-2xl relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter mb-8 drop-shadow-lg">
            中藥儲位查詢
          </h1>
          <div className="space-y-2">
            <p className="text-2xl md:text-4xl font-bold opacity-80 italic">台中慈濟醫院藥學部</p>
            <p className="text-xl md:text-3xl font-black tracking-[0.3em] text-emerald-200">
              胡仁珍 X 許文馨 製作
            </p>
          </div>
        </div>
        {/* 裝飾背景 */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-emerald-600 rounded-full opacity-20"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-emerald-900 rounded-full opacity-30"></div>
      </header>

      <main className="max-w-6xl mx-auto px-4 -mt-12 space-y-12">
        {/* 搜尋輸入 */}
        <div className="relative z-20">
          <input 
            type="text"
            inputMode="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="請輸入 藥名 或 儲位 查詢..."
            className="w-full px-10 py-8 md:px-16 md:py-12 bg-white border-[8px] border-emerald-600 rounded-[3rem] text-4xl md:text-6xl font-black focus:ring-[15px] focus:ring-emerald-100 outline-none shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] text-black placeholder:text-slate-200"
            autoFocus
          />
        </div>

        {error && (
          <div className="p-16 bg-red-50 text-red-600 rounded-[3rem] font-black text-center text-4xl border-8 border-red-100 shadow-2xl">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="py-40 text-center">
            <div className="animate-spin h-32 w-32 border-[15px] border-emerald-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-12 text-emerald-600 font-black text-4xl">同步雲端資料中...</p>
          </div>
        ) : (
          <ResultTable data={filteredData} />
        )}
      </main>
    </div>
  );
};

export default App;