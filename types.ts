
export interface MedicineRecord {
  id: string;
  name: string;        // 藥名
  spec: string;        // 規格
  location: string;    // 儲位
  isRefrigerated: boolean; // 是否為冰庫
  category: string;    // 類別
  stock: number;       // 庫存量
  unit: string;        // 單位
  status: string;      // 狀態
}

export interface SortState {
  column: keyof MedicineRecord;
  direction: 'asc' | 'desc';
}
