
// Fix SaleRecord type error by using MedicineRecord and updating mock data to match the domain.
import { MedicineRecord } from './types';

export const MOCK_DATA: MedicineRecord[] = [
  { id: '1', name: 'Aspirin (阿斯匹靈)', spec: '100mg', location: 'A1-01', category: '口服藥', stock: 150, unit: '顆', status: '正常', isRefrigerated: false },
  { id: '2', name: 'Panadol (普拿疼)', spec: '500mg', location: 'B2-05', category: '口服藥', stock: 5, unit: '顆', status: '低庫存', isRefrigerated: false },
  { id: '3', name: 'Morphine (嗎啡)', spec: '10mg/ml', location: 'S1-01', category: '針劑', stock: 20, unit: '支', status: '正常', isRefrigerated: false },
  { id: '4', name: 'Insulin (胰島素)', spec: '100U/ml', location: 'R1-02', category: '針劑', stock: 0, unit: '瓶', status: '缺藥', isRefrigerated: true },
  { id: '5', name: 'Normal Saline (生理食鹽水)', spec: '500ml', location: 'C3-10', category: '輸液', stock: 100, unit: '袋', status: '正常', isRefrigerated: false },
  { id: '6', name: 'Atorvastatin', spec: '20mg', location: 'A1-02', category: '口服藥', stock: 300, unit: '顆', status: '正常', isRefrigerated: false },
  { id: '7', name: 'Metformin', spec: '500mg', location: 'A1-03', category: '口服藥', stock: 45, unit: '顆', status: '低庫存', isRefrigerated: false },
  { id: '8', name: 'Amoxicillin', spec: '500mg', location: 'B1-01', category: '抗生素', stock: 80, unit: '顆', status: '正常', isRefrigerated: false },
  { id: '9', name: 'Lidocaine', spec: '2%', location: 'S1-05', category: '針劑', stock: 15, unit: '支', status: '正常', isRefrigerated: false },
  { id: '10', name: 'Dextrose 5%', spec: '500ml', location: 'C3-11', category: '輸液', stock: 60, unit: '袋', status: '正常', isRefrigerated: false },
];

export const CATEGORIES = ['All', '口服藥', '針劑', '輸液', '抗生素', '外用藥'];
export const LOCATIONS = ['All', 'A 區', 'B 區', 'C 區', 'S 區', 'R 區'];
export const STATUSES = ['All', '正常', '缺藥', '低庫存'];
