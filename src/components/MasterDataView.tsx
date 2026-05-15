import React, { useState } from 'react';
import { Users, Network, Laptop, UserCheck, ListChecks, Tags, Plus, Trash2, Database, Cloud, Wrench, Lock } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { MasterData, ScopeOfWork, Status } from '../types';
import { hexToRgbA, cn } from '../lib/utils';

interface MasterDataViewProps {
  masterData: MasterData;
  appId: string;
}

interface SimpleListEditorProps {
  title: string;
  dataKey: keyof MasterData;
  placeholder: string;
  icon: any;
  masterData: MasterData;
  canEdit: boolean;
  updateFn: (key: string, val: any) => void;
}

const SimpleListEditor: React.FC<SimpleListEditorProps> = ({ title, dataKey, placeholder, icon: Icon, masterData, canEdit, updateFn }) => {
  const [input, setInput] = useState('');
  const list = (masterData[dataKey] as string[]) || [];

  const add = () => {
    if (!input.trim()) return;
    updateFn(dataKey, [...list, input.trim()]);
    setInput('');
  };

  const remove = (idx: number) => {
    window.customConfirm('ยืนยันลบข้อมูลนี้?', () => {
      updateFn(dataKey, list.filter((_, i) => i !== idx));
    });
  };

  return (
    <div className={cn("bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full transition-all", !canEdit && "opacity-80")}>
      <h3 className="font-bold text-slate-800 mb-3 flex items-center">
        <Icon className="w-5 h-5 text-blue-600 mr-2" />{title}
      </h3>
      {canEdit && (
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
      )}
      <ul className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-48 min-h-[120px]">
        {list.length === 0 && <li className="text-xs text-center text-slate-400 py-4">ไม่มีข้อมูล</li>}
        {list.map((item, idx) => (
          <li key={idx} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 text-sm group hover:border-slate-200 transition-colors">
            <span className="text-slate-700 font-medium truncate pr-2">{item}</span>
            {canEdit && (
              <button onClick={() => remove(idx)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const ScopeOfWorkEditor = ({ masterData, canEdit, updateFn }: { masterData: MasterData, canEdit: boolean, updateFn: (key: string, val: any) => void }) => {
  const rawList = masterData.scopeOfWorks || [];
  const list = rawList.map(item => typeof item === 'string' ? { name: item, duration: 60, isManual: false } : item);

  const add = () => updateFn('scopeOfWorks', [...list, { name: 'Scope ใหม่', duration: 60, isManual: false }]);
  const update = (idx: number, field: string, val: any) => {
    const newList = [...list];
    newList[idx] = { ...newList[idx], [field]: val };
    updateFn('scopeOfWorks', newList);
  };
  const remove = (idx: number) => {
    window.customConfirm('ยืนยันลบ Scope นี้?', () => {
      updateFn('scopeOfWorks', list.filter((_, i) => i !== idx));
    });
  };

  return (
    <div className={cn("bg-white p-4 rounded-xl border border-slate-200 shadow-sm md:col-span-1 lg:col-span-2 flex flex-col h-full transition-all", !canEdit && "opacity-80")}>
      <div className="flex justify-between items-center mb-3 border-b pb-2">
        <h3 className="font-bold text-slate-800 flex items-center">
          <ListChecks className="w-5 h-5 text-blue-600 mr-2" /> รายการ Scope of Work และระยะเวลา
        </h3>
        {canEdit && (
          <button onClick={add} className="text-[10px] bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded-lg font-bold border border-blue-200 transition-colors flex items-center gap-1">
            <Plus className="w-3 h-3" /> เพิ่ม Scope
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[350px]">
        {list.length === 0 && <div className="col-span-2 text-center text-xs text-slate-400 py-4">ไม่มีข้อมูล</div>}
        {list.map((sw, idx) => (
          <div key={idx} className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg relative group">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={sw.name}
                readOnly={!canEdit}
                onChange={e => update(idx, 'name', e.target.value)}
                className={cn(
                  "flex-1 border rounded px-2 py-1 text-sm outline-none font-bold",
                  canEdit ? "border-slate-300 focus:border-blue-500 bg-white shadow-sm" : "border-transparent bg-transparent"
                )}
              />
              {canEdit && (
                <button onClick={() => remove(idx)} className="text-slate-300 hover:text-red-500 px-1 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
               <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">เวลาทำงาน:</span>
                  <div className={cn("flex items-center border rounded overflow-hidden shadow-sm", canEdit ? "border-slate-300 bg-white" : "border-transparent text-slate-600")}>
                     <input 
                        type="number" 
                        value={sw.duration} 
                        readOnly={!canEdit}
                        onChange={e => update(idx, 'duration', parseInt(e.target.value) || 0)}
                        className={cn("w-14 px-1 py-1 text-xs outline-none text-center bg-transparent")} 
                     />
                     <span className="bg-slate-100 px-1 py-1 text-[9px] font-bold text-slate-500 border-l border-slate-300">Min</span>
                  </div>
               </div>
               <label className={cn("flex items-center gap-1.5 cursor-pointer bg-white px-2 py-1 border border-slate-200 rounded-md shadow-sm", !canEdit && "pointer-events-none opacity-80")}>
                  <input 
                     type="checkbox" 
                     checked={sw.isManual} 
                     disabled={!canEdit}
                     onChange={e => update(idx, 'isManual', e.target.checked)}
                     className="w-3 h-3 rounded text-blue-600"
                  />
                  <span className="text-[9px] font-bold text-slate-600">กำหนดเอง</span>
               </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StatusEditor = ({ masterData, canEdit, updateFn }: { masterData: MasterData, canEdit: boolean, updateFn: (key: string, val: any) => void }) => {
  const list = masterData.statuses || [];
  const add = () => updateFn('statuses', [...list, { name: 'สถานะใหม่', bg: '#e2e8f0', text: '#475569' }]);
  const update = (idx: number, field: string, val: string) => {
    const newList = [...list];
    newList[idx] = { ...newList[idx], [field]: val };
    updateFn('statuses', newList);
  };
  const remove = (idx: number) => {
    window.customConfirm('ยืนยันลบสถานะนี้?', () => {
      updateFn('statuses', list.filter((_, i) => i !== idx));
    });
  };

  return (
    <div className={cn("bg-white p-4 rounded-xl border border-slate-200 shadow-sm md:col-span-1 lg:col-span-2 flex flex-col h-full transition-all", !canEdit && "opacity-80")}>
      <div className="flex justify-between items-center mb-3 border-b pb-2">
        <h3 className="font-bold text-slate-800 flex items-center">
          <Tags className="w-5 h-5 text-blue-600 mr-2" /> ตั้งค่าสถานะงานและสี
        </h3>
        {canEdit && (
          <button onClick={add} className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-bold border border-blue-200 transition-colors flex items-center gap-1">
            <Plus className="w-3 h-3" /> เพิ่มสถานะ
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[300px]">
        {list.length === 0 && <div className="col-span-1 sm:grid-cols-2 text-center text-xs text-slate-400 py-4">ไม่มีสถานะ</div>}
        {list.map((st, idx) => (
          <div key={idx} className="flex flex-col gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg relative group transition-colors">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={st.name}
                readOnly={!canEdit}
                onChange={e => update(idx, 'name', e.target.value)}
                placeholder="ชื่อสถานะ"
                className={cn(
                  "flex-1 border rounded px-2 py-1 text-sm outline-none font-bold text-slate-700",
                  canEdit ? "border-slate-300 focus:border-blue-500 bg-white shadow-sm" : "border-transparent bg-transparent"
                )}
              />
              {canEdit && (
                <button onClick={() => remove(idx)} className="text-slate-300 hover:text-red-500 px-1 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex gap-3 items-center justify-between mt-1">
              <div className="flex gap-3">
                <div className={cn("flex items-center gap-1.5 bg-white px-2 py-1 border rounded-md shadow-sm", !canEdit && "pointer-events-none")}>
                  <span className="text-[10px] text-slate-500 font-bold">พื้นหลัง</span>
                  <input type="color" value={st.bg} disabled={!canEdit} onChange={e => update(idx, 'bg', e.target.value)} className="w-5 h-5 p-0 border-0 cursor-pointer rounded" />
                </div>
                <div className={cn("flex items-center gap-1.5 bg-white px-2 py-1 border rounded-md shadow-sm", !canEdit && "pointer-events-none")}>
                  <span className="text-[10px] text-slate-500 font-bold">ตัวอักษร</span>
                  <input type="color" value={st.text} disabled={!canEdit} onChange={e => update(idx, 'text', e.target.value)} className="w-5 h-5 p-0 border-0 cursor-pointer rounded" />
                </div>
              </div>
              <div className="ml-auto">
                <span
                  className="text-xs px-2 py-1 rounded-md border font-bold shadow-sm"
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

export const MasterDataView: React.FC<MasterDataViewProps> = ({ masterData, appId }) => {
  const [canEdit, setCanEdit] = useState(false);

  const updateDataInFirebase = async (key: string, val: any) => {
    if (!canEdit) return;
    const newData = { ...masterData, [key]: val };
    const docPath = `artifacts/${appId}/public/data/settings/masterData`;
    try {
      await setDoc(doc(db, docPath), newData);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, docPath);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl text-indigo-800 shadow-sm flex items-center justify-between shrink-0">
        <div className="flex items-start gap-3">
          <Cloud className="w-5 h-5 mt-1 text-indigo-600" />
          <div>
            <h3 className="font-bold text-base mb-1">ระบบจัดการฐานข้อมูล (Cloud Master Data)</h3>
            <p className="text-sm text-indigo-700/80">แก้ไขข้อมูลตัวเลือกต่างๆ ในระบบ และตรวจสอบความถูกต้อง</p>
          </div>
        </div>
        <button 
          onClick={() => setCanEdit(!canEdit)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all shadow-sm active:scale-95 text-sm whitespace-nowrap",
            canEdit 
              ? "bg-red-500 text-white hover:bg-red-600 ring-2 ring-red-100" 
              : "bg-blue-600 text-white hover:bg-blue-700 ring-2 ring-blue-100"
          )}
        >
          {canEdit ? <Lock className="w-3.5 h-3.5" /> : <Wrench className="w-3.5 h-3.5" />}
          {canEdit ? "ล็อคข้อมูล" : "เปิดโหมดแก้ไข"}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12 overflow-y-auto custom-scrollbar pr-1">
        <SimpleListEditor title="Region Responsible" dataKey="equipTeams" placeholder="เพิ่มทีม Region..." icon={Users} masterData={masterData} canEdit={canEdit} updateFn={updateDataInFirebase} />
        <SimpleListEditor title="Fiber Responsible" dataKey="fiberTeams" placeholder="เพิ่มทีม Fiber..." icon={Network} masterData={masterData} canEdit={canEdit} updateFn={updateDataInFirebase} />
        <SimpleListEditor title="Config Responsible" dataKey="configTeams" placeholder="เพิ่มทีม Config..." icon={Laptop} masterData={masterData} canEdit={canEdit} updateFn={updateDataInFirebase} />
        <SimpleListEditor title="PM" dataKey="pmTeams" placeholder="เพิ่ม PM..." icon={UserCheck} masterData={masterData} canEdit={canEdit} updateFn={updateDataInFirebase} />
        <ScopeOfWorkEditor masterData={masterData} canEdit={canEdit} updateFn={updateDataInFirebase} />
        <StatusEditor masterData={masterData} canEdit={canEdit} updateFn={updateDataInFirebase} />
      </div>
    </div>
  );
};
