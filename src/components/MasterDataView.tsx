import React, { useState } from 'react';
import { Users, Network, Laptop, UserCheck, ListChecks, Tags, Plus, Trash2, Database, Cloud } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { MasterData } from '../types';
import { hexToRgbA } from '../lib/utils';

interface MasterDataViewProps {
  masterData: MasterData;
  appId: string;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({ masterData, appId }) => {

  const updateDataInFirebase = async (key: string, val: any) => {
    const newData = { ...masterData, [key]: val };
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'masterData'), newData);
    } catch (e) {
      console.error("Error updating master data:", e);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  const SimpleListEditor = ({ title, dataKey, placeholder, icon: Icon }: { title: string, dataKey: keyof MasterData, placeholder: string, icon: any }) => {
    const [input, setInput] = useState('');
    const list = (masterData[dataKey] as string[]) || [];

    const add = () => {
      if (!input.trim()) return;
      updateDataInFirebase(dataKey, [...list, input.trim()]);
      setInput('');
    };

    const remove = (idx: number) => {
      if (window.confirm('ยืนยันลบข้อมูลนี้?')) {
        updateDataInFirebase(dataKey, list.filter((_, i) => i !== idx));
      }
    };

    return (
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
        <h3 className="font-bold text-slate-800 mb-3 flex items-center">
          <Icon className="w-5 h-5 text-blue-600 mr-2" />{title}
        </h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder={placeholder}
            className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <button onClick={add} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <ul className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-48 min-h-[120px]">
          {list.length === 0 && <li className="text-xs text-center text-slate-400 py-4">ไม่มีข้อมูล</li>}
          {list.map((item, idx) => (
            <li key={idx} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 text-sm group hover:border-slate-200 transition-colors">
              <span className="text-slate-700 font-medium truncate pr-2">{item}</span>
              <button onClick={() => remove(idx)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const StatusEditor = () => {
    const list = masterData.statuses || [];
    const add = () => updateDataInFirebase('statuses', [...list, { name: 'สถานะใหม่', bg: '#e2e8f0', text: '#475569' }]);
    const update = (idx: number, field: string, val: string) => {
      const newList = [...list];
      (newList[idx] as any)[field] = val;
      updateDataInFirebase('statuses', newList);
    };
    const remove = (idx: number) => {
      if (window.confirm('ยืนยันลบสถานะนี้?')) {
        updateDataInFirebase('statuses', list.filter((_, i) => i !== idx));
      }
    };

    return (
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm md:col-span-2 flex flex-col h-full">
        <div className="flex justify-between items-center mb-3 border-b pb-2">
          <h3 className="font-bold text-slate-800 flex items-center">
            <Tags className="w-5 h-5 text-blue-600 mr-2" /> ตั้งค่าสถานะงานและสี
          </h3>
          <button onClick={add} className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-bold border border-blue-200 transition-colors flex items-center gap-1">
            <Plus className="w-3 h-3" /> เพิ่มสถานะ
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[300px]">
          {list.length === 0 && <div className="col-span-1 sm:col-span-2 text-center text-xs text-slate-400 py-4">ไม่มีสถานะ</div>}
          {list.map((st, idx) => (
            <div key={idx} className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg relative group hover:border-blue-200 transition-colors">
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={st.name}
                  onChange={e => update(idx, 'name', e.target.value)}
                  placeholder="ชื่อสถานะ"
                  className="flex-1 border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-blue-500 font-bold text-slate-700"
                />
                <button onClick={() => remove(idx)} className="text-slate-300 hover:text-red-500 px-1 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-3 items-center justify-between mt-1">
                <div className="flex gap-3">
                  <div className="flex items-center gap-1.5 bg-white px-2 py-1 border rounded-md">
                    <span className="text-[10px] text-slate-500 font-bold">พื้นหลัง</span>
                    <input type="color" value={st.bg} onChange={e => update(idx, 'bg', e.target.value)} className="w-5 h-5 p-0 border-0 cursor-pointer rounded" />
                  </div>
                  <div className="flex items-center gap-1.5 bg-white px-2 py-1 border rounded-md">
                    <span className="text-[10px] text-slate-500 font-bold">ตัวอักษร</span>
                    <input type="color" value={st.text} onChange={e => update(idx, 'text', e.target.value)} className="w-5 h-5 p-0 border-0 cursor-pointer rounded" />
                  </div>
                </div>
                <div className="ml-auto">
                  <span
                    className="text-xs px-2 py-1 rounded-md border font-bold"
                    style={{ backgroundColor: hexToRgbA(st.bg, 0.2), color: st.text, borderColor: st.bg }}
                  >
                    {st.name || 'ตัวอย่าง'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl text-indigo-800 shadow-sm flex items-start gap-3 shrink-0">
        <Cloud className="w-5 h-5 mt-1 text-indigo-600" />
        <div>
          <h3 className="font-bold text-base mb-1">ระบบจัดการฐานข้อมูล (Cloud Master Data)</h3>
          <p className="text-sm text-indigo-700/80">ข้อมูลที่คุณอัปเดตที่นี่จะถูกบันทึกขึ้น Cloud ทันที และจะถูกซิงค์ไปยังอุปกรณ์อื่นๆ ที่กำลังเปิดหน้านี้อยู่แบบ Real-time</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SimpleListEditor title="Region Responsible" dataKey="equipTeams" placeholder="เพิ่มทีม Region..." icon={Users} />
        <SimpleListEditor title="Fiber Responsible" dataKey="fiberTeams" placeholder="เพิ่มทีม Fiber..." icon={Network} />
        <SimpleListEditor title="Config Responsible" dataKey="configTeams" placeholder="เพิ่มทีม Config..." icon={Laptop} />
        <SimpleListEditor title="PM" dataKey="pmTeams" placeholder="เพิ่ม PM..." icon={UserCheck} />
        <SimpleListEditor title="Scope of Work" dataKey="scopeOfWorks" placeholder="เพิ่ม Scope..." icon={ListChecks} />
        <StatusEditor />
      </div>
    </div>
  );
};
