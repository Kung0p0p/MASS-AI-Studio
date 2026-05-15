import React, { useState } from 'react';
import { ClipboardList, CloudUpload, Users, Wrench } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { MasterData, TaskSys1 } from '../types';
import { MultiSelect } from './MultiSelect';
import { getScopeDuration } from '../lib/utils';

interface AssignSys1FormProps {
  tasksSys1: TaskSys1[];
  masterData: MasterData;
  onClose?: () => void;
  isModal?: boolean;
  appId: string;
}

export const AssignSys1Form: React.FC<AssignSys1FormProps> = ({ tasksSys1, masterData, onClose, isModal = false, appId }) => {

  const [form, setForm] = useState({
    dateTime: new Date().toLocaleString('th-TH', { hour12: false }),
    installDate: '',
    startTime: '09:00',
    endTime: '10:00',
    helperEndTime: '10:00',
    equipTeams: [] as string[],
    equipTeamsSub: [] as string[],
    fiberTeams: [] as string[],
    configTeam: '',
    pmTeam: '',
    cid: '',
    customerName: '',
    scopeOfWork: '',
    otherScopeDetail: '',
    customerContact: '',
    location: '',
    status: 'รอรับงาน',
    remark: ''
  });

  const isCustomScope = (scopeName: string) => {
    const s = scopeName || '';
    return s.includes('กำหนดเวลาเอง') || s.includes('Custom') || s.includes('อื่นๆ');
  };

  const disableEndTimeField = !isCustomScope(form.scopeOfWork) && form.scopeOfWork !== '';

  const handleScopeChange = (scopeName: string) => {
    if (!isCustomScope(scopeName) && scopeName !== '') {
      const duration = getScopeDuration(scopeName);
      if (form.startTime) {
        const [h, m] = form.startTime.split(':').map(Number);
        const date = new Date();
        date.setHours(h, m + duration);
        const newEndTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        setForm({ ...form, scopeOfWork: scopeName, endTime: newEndTime });
      } else {
        setForm({ ...form, scopeOfWork: scopeName });
      }
    } else {
      setForm({ ...form, scopeOfWork: scopeName });
    }
  };

  const handleStartTimeChange = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const hDate = new Date();
    hDate.setHours(h, m + 60);
    const newHelperEndTime = `${String(hDate.getHours()).padStart(2, '0')}:${String(hDate.getMinutes()).padStart(2, '0')}`;

    if (!isCustomScope(form.scopeOfWork) && form.scopeOfWork !== '') {
      const duration = getScopeDuration(form.scopeOfWork);
      const date = new Date();
      date.setHours(h, m + duration);
      const newEndTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      setForm({ ...form, startTime: time, endTime: newEndTime, helperEndTime: newHelperEndTime });
    } else {
      setForm({ ...form, startTime: time, helperEndTime: newHelperEndTime });
    }
  };

  const timeToMin = (t: string) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const handleSubmit = async () => {
    if (!form.scopeOfWork) return alert('กรุณาเลือก Scope of Work');
    if (form.scopeOfWork === 'อื่นๆ (Other)' && !form.otherScopeDetail.trim()) return alert('กรุณาระบุรายละเอียดสำหรับ Scope งาน "อื่นๆ"');
    if (!form.cid || !form.installDate || !form.startTime || !form.endTime) return alert('กรุณากรอกข้อมูลสำคัญให้ครบ (CID, วันที่ และเวลาติดตั้ง)');

    const newStartMin = timeToMin(form.startTime);
    const newEndMin = timeToMin(form.endTime);
    const newHelperEndMin = timeToMin(form.helperEndTime);

    if (newStartMin >= newEndMin) return alert('❌ เวลาสิ้นสุดงานต้องมากกว่าเวลาเริ่มงาน');
    if (newStartMin >= newHelperEndMin) return alert('❌ เวลาสิ้นสุด(ผู้ช่วย) ต้องมากกว่าเวลาเริ่มงาน');

    const allNewPrimaryEquip = [...form.equipTeams];
    const allNewSecondaryEquip = [...form.equipTeamsSub];

    let conflictDetails: any = null;

    for (let task of tasksSys1) {
      if (task.installDate !== form.installDate) continue;
      if (!task.startTime || !task.endTime) continue;

      const tStart = timeToMin(task.startTime);
      const tEnd = timeToMin(task.endTime);
      const tHelperEnd = task.helperEndTime ? timeToMin(task.helperEndTime) : tEnd;

      const tStartWithGap = tStart - 60;

      const taskPrimaryEquip = [...(task.equipTeams || [])];
      const taskSecondaryEquip = [...(task.equipTeamsSub || [])];

      for (let team of allNewPrimaryEquip) {
        const isTaskPrimary = taskPrimaryEquip.includes(team);
        const isTaskSecondary = taskSecondaryEquip.includes(team);
        if (!isTaskPrimary && !isTaskSecondary) continue;

        const checkTaskEnd = isTaskPrimary ? tEnd : tHelperEnd;
        const checkTaskEndWithGap = checkTaskEnd + 60;

        if ((newStartMin < checkTaskEndWithGap) && (newEndMin > tStartWithGap)) {
          conflictDetails = { task, team, role: 'Main', conflictWith: isTaskPrimary ? 'Main' : 'Sub' };
          break;
        }
      }
      if (conflictDetails) break;

      for (let team of allNewSecondaryEquip) {
        const isTaskPrimary = taskPrimaryEquip.includes(team);
        const isTaskSecondary = taskSecondaryEquip.includes(team);
        if (!isTaskPrimary && !isTaskSecondary) continue;

        const checkTaskEnd = isTaskPrimary ? tEnd : tHelperEnd;
        const checkTaskEndWithGap = checkTaskEnd + 60;

        if ((newStartMin < checkTaskEndWithGap) && (newHelperEndMin > tStartWithGap)) {
          conflictDetails = { task, team, role: 'Sub', conflictWith: isTaskPrimary ? 'Main' : 'Sub' };
          break;
        }
      }
      if (conflictDetails) break;
    }

    if (conflictDetails) {
      const conflictEndTime = conflictDetails.conflictWith === 'Main' ? conflictDetails.task.endTime : (conflictDetails.task.helperEndTime || conflictDetails.task.endTime);
      return alert(`❌ ไม่สามารถมอบหมายงานได้!\n\nทีม [${conflictDetails.team}] (ในตำแหน่ง ${conflictDetails.role}) ติดงานอื่น หรืออยู่ในช่วงเวลาเดินทาง (เว้น 1 ชั่วโมง)\n\nลูกค้ารายที่ติดงาน: ${conflictDetails.task.customerName || conflictDetails.task.cid}\nเวลาทำงาน: ${conflictDetails.task.startTime} - ${conflictEndTime}`);
    }

    try {
      const taskId = `sys1_${Date.now()}`;
      const newTask = { id: taskId, ...form, createdAt: new Date().toISOString() };
      const taskDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'tasksSys1', taskId);
      await setDoc(taskDocRef, newTask);
      alert('✅ บันทึกงาน Region Assignment ขึ้น Cloud สำเร็จ!');
      setForm({ dateTime: new Date().toLocaleString('th-TH', { hour12: false }), installDate: '', startTime: '09:00', endTime: '10:00', helperEndTime: '10:00', equipTeams: [], equipTeamsSub: [], fiberTeams: [], configTeam: '', cid: '', customerName: '', scopeOfWork: '', otherScopeDetail: '', customerContact: '', location: '', pmTeam: '', status: 'รอรับงาน', remark: '' });
      if (onClose) onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `artifacts/${appId}/public/data/tasksSys1`);
    }
  };

  const content = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2 flex justify-end items-center mb-[-10px]">
        <span className="text-[10px] font-bold text-slate-400 uppercase">วันที่บันทึก (Record Date): {form.dateTime}</span>
      </div>

      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-5 gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
        <div className="md:col-span-2 flex flex-col gap-2">
          <div>
            <label className="text-xs font-bold text-blue-700 uppercase">Scope of Work <span className="text-red-500">*</span></label>
            <select value={form.scopeOfWork} onChange={e => handleScopeChange(e.target.value)} className="w-full mt-1 px-3 py-2 border border-blue-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 text-slate-700">
              <option value="">- เลือก Scope -</option>
              {masterData.scopeOfWorks.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {form.scopeOfWork === 'อื่นๆ (Other)' && (
            <div className="mt-1">
              <input type="text" value={form.otherScopeDetail} onChange={e => setForm({ ...form, otherScopeDetail: e.target.value })} placeholder="โปรดระบุรายละเอียดงาน..." className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" required />
            </div>
          )}
        </div>
        <div className="md:col-span-1"><label className="text-[11px] font-bold text-blue-700 uppercase">วันที่ติดตั้ง <span className="text-red-500">*</span></label><input type="date" value={form.installDate} onChange={e => setForm({ ...form, installDate: e.target.value })} className="w-full mt-1 px-3 py-2 border border-blue-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" required /></div>
        <div className="md:col-span-1"><label className="text-[11px] font-bold text-blue-700 uppercase">เวลาเริ่ม <span className="text-red-500">*</span></label><input type="time" value={form.startTime} onChange={e => handleStartTimeChange(e.target.value)} className="w-full mt-1 px-3 py-2 border border-blue-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" required /></div>
        <div className="md:col-span-1"><label className="text-[11px] font-bold text-blue-700 uppercase">สิ้นสุด(หลัก) <span className="text-red-500">*</span></label><input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} disabled={disableEndTimeField} className={`w-full mt-1 px-3 py-2 border border-blue-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 ${disableEndTimeField ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-white'}`} required /></div>
      </div>

      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-bold text-slate-700 border-b pb-1 mb-3 flex items-center"><Users className="w-4 h-4 text-blue-500 mr-2" />Region Responsible</p>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Main (เต็มเวลา)</label>
              <MultiSelect options={masterData.equipTeams.filter(t => !form.equipTeamsSub.includes(t))} selected={form.equipTeams} onChange={v => setForm({ ...form, equipTeams: v })} placeholder="เลือกทีม Main" />
              {form.equipTeams.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {form.equipTeams.map(t => <span key={t} className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded border border-blue-200 font-semibold">{t}</span>)}
                </div>
              )}
            </div>
            <div className="pt-2 border-t border-slate-100">
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Sub (Part-time)</label>
              <MultiSelect options={masterData.equipTeams.filter(t => !form.equipTeams.includes(t))} selected={form.equipTeamsSub} onChange={v => setForm({ ...form, equipTeamsSub: v })} placeholder="เลือกทีม Sub" />
              {form.equipTeamsSub.length > 0 && (
                <div className="mt-2 bg-sky-50 p-2 rounded-lg border border-sky-100">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {form.equipTeamsSub.map(t => <span key={t} className="bg-sky-100 text-sky-700 text-[10px] px-1.5 py-0.5 rounded border border-sky-200 font-semibold">{t}</span>)}
                  </div>
                  <div className="flex items-center justify-between border-t border-sky-100 pt-2">
                    <label className="text-[10px] font-bold text-sky-700 uppercase">เวลาสิ้นสุด (ทีม Sub) <span className="text-red-500">*</span></label>
                    <input type="time" value={form.helperEndTime} onChange={e => setForm({ ...form, helperEndTime: e.target.value })} className="w-32 px-2 py-1 border border-sky-200 rounded text-xs outline-none focus:ring-2 focus:ring-sky-500 bg-white" required />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <p className="text-sm font-bold text-slate-700 border-b pb-1 mb-3 flex items-center"><Wrench className="w-4 h-4 text-slate-400 mr-2" />ทีมงานสนับสนุนอื่นๆ</p>
          <div className="space-y-4 flex-1">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Fiber Responsible</label>
              <MultiSelect options={masterData.fiberTeams} selected={form.fiberTeams} onChange={v => setForm({ ...form, fiberTeams: v })} placeholder="เลือกทีม Fiber" />
              {form.fiberTeams.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {form.fiberTeams.map(t => <span key={t} className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.5 rounded border border-slate-300 font-semibold">{t}</span>)}
                </div>
              )}
            </div>
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Config Responsible</label>
                <select value={form.configTeam} onChange={e => setForm({ ...form, configTeam: e.target.value })} className="w-full h-[38px] border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">- เลือกทีม -</option>
                  {masterData.configTeams.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">PM (ผู้รับผิดชอบ)</label>
                <select value={form.pmTeam} onChange={e => setForm({ ...form, pmTeam: e.target.value })} className="w-full h-[38px] border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">- เลือก PM -</option>
                  {masterData.pmTeams.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1">
          <label className="text-xs font-bold text-slate-500 uppercase">CIDs <span className="text-red-500">*</span></label>
          <input type="text" value={form.cid} onChange={e => setForm({ ...form, cid: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm font-bold text-blue-700 outline-none focus:border-blue-500 border-slate-300" placeholder="ระบุ CID" />
        </div>
        <div className="md:col-span-3">
          <label className="text-xs font-bold text-slate-500 uppercase">Customer Name</label>
          <input type="text" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none focus:border-blue-500 border-slate-300" placeholder="ระบุชื่อลูกค้า..." />
        </div>
      </div>

      <div><label className="text-xs font-bold text-slate-500 uppercase">Address</label><input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none focus:border-blue-500 border-slate-300" /></div>
      <div><label className="text-xs font-bold text-slate-500 uppercase">Customer Contact</label><input type="text" value={form.customerContact} onChange={e => setForm({ ...form, customerContact: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none focus:border-blue-500 border-slate-300" /></div>

      <div className="md:col-span-2"><label className="text-xs font-bold text-slate-500 uppercase">Remark</label><textarea rows={2} value={form.remark} onChange={e => setForm({ ...form, remark: e.target.value })} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm outline-none focus:border-blue-500 border-slate-300"></textarea></div>

      <div className="md:col-span-2 text-right border-t pt-4 mt-2">
        <button type="button" onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-lg shadow-sm transition-colors flex items-center gap-2 ml-auto">
          <CloudUpload className="w-4 h-4" /> บันทึกขึ้น Cloud
        </button>
      </div>
    </div>
  );

  if (isModal) return content;

  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-200 max-w-4xl mx-auto w-full">
      <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-3 flex items-center">
        <ClipboardList className="w-5 h-5 text-blue-600 mr-2" /> ฟอร์ม Assign งาน Region
      </h2>
      {content}
    </div>
  );
};
