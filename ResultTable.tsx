import React from 'react';
import { MedicineRecord } from './types';

interface ResultTableProps {
  data: MedicineRecord[];
}

const ResultTable: React.FC<ResultTableProps> = ({ data }) => {
  return (
    <div className="space-y-3 md:space-y-6">
      {data.length > 0 ? (
        data.map((row) => (
          <div 
            key={row.id} 
            className="bg-white rounded-xl md:rounded-[2.5rem] p-3 md:p-6 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center justify-between gap-3 md:gap-5 transition-transform active:scale-[0.99]"
          >
            {/* 左側：藥名 */}
            <div className="flex-1 min-w-0 mr-1">
              <h2 className="text-lg sm:text-xl md:text-5xl font-black text-slate-800 leading-tight tracking-tight break-words line-clamp-2">
                {row.name}
              </h2>
            </div>

            {/* 右側：儲位與冰庫標示 */}
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              {/* 冰庫圖示 */}
              {row.isRefrigerated && (
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-24 md:h-24 bg-blue-50 text-blue-500 rounded-lg md:rounded-[1.5rem] flex items-center justify-center shadow-sm">
                  <i className="fas fa-snowflake text-sm sm:text-base md:text-5xl animate-pulse"></i>
                </div>
              )}

              {/* 儲位 (字體與框框皆縮小約 0.5 倍) */}
              <div className="bg-emerald-600 px-2 py-2 sm:px-4 sm:py-2 md:px-8 md:py-4 rounded-lg md:rounded-[1.5rem] shadow-md flex items-center justify-center min-w-[3rem] sm:min-w-[4.5rem] md:min-w-[10rem]">
                <span className="text-lg sm:text-2xl md:text-5xl lg:text-6xl leading-none font-black text-white tracking-tighter tabular-nums">
                  {row.location}
                </span>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="py-12 md:py-24 text-center bg-white rounded-2xl md:rounded-[2.5rem] border-4 border-dashed border-slate-100">
          <i className="fas fa-search text-4xl md:text-6xl text-slate-200 mb-4 md:mb-6"></i>
          <p className="text-slate-300 font-black text-xl md:text-3xl uppercase italic tracking-widest">查無資料</p>
        </div>
      )}
      
      {data.length > 0 && (
        <div className="text-center py-6 md:py-12 opacity-20">
          <div className="h-1 md:h-2 w-16 md:w-24 bg-emerald-900 mx-auto rounded-full mb-2 md:mb-3"></div>
          <p className="text-emerald-900 font-black text-xs md:text-lg tracking-[0.3em] md:tracking-[0.5em] uppercase">END OF LIST</p>
        </div>
      )}
    </div>
  );
};

export default ResultTable;