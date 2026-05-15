import React, { useState } from 'react';
import { MapPin, CloudUpload, Network } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { MasterData } from '../types';

interface AssignSys2FormProps {
  masterData: MasterData;
  onClose?: () => void;
  isModal?: boolean;
  appId: string;
}

export const AssignSys2Form: React.FC<AssignSys2FormProps> = ({ masterData, onClose, isModal = false, appId }) => {
  const [form, setForm] = useState({ 
    date: new Date().toLocaleString('th-TH', { hour12: false }), 
    surveyId: '', 
    location: '', 
    surveyor: '', 
    status: 'รอรับงาน' 
  });

  const handleSubmit = async () => {
    if (!form.surveyId) return alert('กรุณาระบุ Survey ID');
    try {
      const taskId = `sys2_${Date.now()}`;
      const colPath = `artifacts/${appId}/public/data/tasksSys2`;
      await setDoc(doc(db, colPath, taskId), { id: taskId, ...form });
      alert('✅ บันทึกงานสำรวจขึ้น Cloud สำเร็จ!');
      setForm({ date: new Date().toLocaleString('th-TH', { hour12: false }), surveyId: '', location: '', surveyor: '', status: 'รอรับงาน' });
      if (onClose) onClose();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `artifacts/${appId}/public/data/tasksSys2`);
    }
  };

  const content = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <label className="text-xs font-bold text-slate-500 uppercase">วันที่/เวลา</label>
        <input type="text" value={form.date} disabled className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-slate-50 text-slate-500" />
      </div>
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase">Survey ID <span className="text-red-500">*</span></label>
        <input type="text" value={form.surveyId} onChange={e => setForm({ ...form, surveyId: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm border-amber-300 focus:ring-amber-500 outline-none" required />
      </div>
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase">Location</label>
        <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-amber-500 border-slate-300 outline-none" />
      </div>
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase">ทีมสำรวจ (Surveyor)</label>
        <input type="text" value={form.surveyor} onChange={e => setForm({ ...form, surveyor: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-amber-500 border-slate-300 outline-none" />
      </div>
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase">สถานะ</label>
        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-amber-500 outline-none border-slate-300">
          {masterData.statuses.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
        </select>
      </div>
      <div className="md:col-span-2 text-right border-t pt-4 mt-2">
        <button type="button" onClick={handleSubmit} className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-8 rounded-lg shadow-sm flex items-center justify-center gap-2 ml-auto">
          <CloudUpload className="w-4 h-4" /> บันทึกงานขึ้น Cloud
        </button>
      </div>
    </div>
  );

  if (isModal) return content;

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 w-full">
      <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-3 flex items-center">
        <MapPin className="w-5 h-5 text-amber-600 mr-2" /> บันทึกงานสำรวจ
      </h2>
      {content}
    </div>
  );
};

interface AssignSys3FormProps {
  masterData: MasterData;
  onClose?: () => void;
  isModal?: boolean;
  appId: string;
}

export const AssignSys3Form: React.FC<AssignSys3FormProps> = ({ masterData, onClose, isModal = false, appId }) => {
  const [form, setForm] = useState({ 
    date: new Date().toLocaleString('th-TH', { hour12: false }), 
    cid: '', 
    fromPort: '', 
    toPort: '', 
    status: 'รอรับงาน' 
  });

  const handleSubmit = async () => {
    if (!form.cid) return alert('กรุณาระบุ CID');
    try {
      const taskId = `sys3_${Date.now()}`;
      const colPath = `artifacts/${appId}/public/data/tasksSys3`;
      await setDoc(doc(db, colPath, taskId), { id: taskId, ...form });
      alert('✅ บันทึกออเดอร์ Cross Connect ขึ้น Cloud สำเร็จ!');
      setForm({ date: new Date().toLocaleString('th-TH', { hour12: false }), cid: '', fromPort: '', toPort: '', status: 'รอรับงาน' });
      if (onClose) onClose();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `artifacts/${appId}/public/data/tasksSys3`);
    }
  };

  const content = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <label className="text-xs font-bold text-slate-500 uppercase">วันที่เปิดออเดอร์</label>
        <input type="text" value={form.date} disabled className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-slate-50 text-slate-500" />
      </div>
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase">CID <span className="text-red-500">*</span></label>
        <input type="text" value={form.cid} onChange={e => setForm({ ...form, cid: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm border-emerald-300 focus:ring-emerald-500 outline-none" required />
      </div>
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase">สถานะ</label>
        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-emerald-500 outline-none border-slate-300">
          {masterData.statuses.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
        </select>
      </div>
      <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 md:col-span-2 grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">จาก Port (From)</label>
          <input type="text" value={form.fromPort} onChange={e => setForm({ ...form, fromPort: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm border-slate-300 outline-none focus:border-emerald-500" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase">ไป Port (To)</label>
          <input type="text" value={form.toPort} onChange={e => setForm({ ...form, toPort: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm border-slate-300 outline-none focus:border-emerald-500" />
        </div>
      </div>
      <div className="md:col-span-2 text-right border-t pt-4 mt-2">
        <button type="button" onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-8 rounded-lg shadow-sm flex items-center justify-center gap-2 ml-auto">
          <CloudUpload className="w-4 h-4" /> บันทึกออเดอร์ขึ้น Cloud
        </button>
      </div>
    </div>
  );

  if (isModal) return content;

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 w-full">
      <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-3 flex items-center">
        <Network className="w-5 h-5 text-emerald-600 mr-2" /> เปิดออเดอร์ Cross Connect
      </h2>
      {content}
    </div>
  );
};
