import React from 'react';
import { Home, UserCog, MapPin, Network, Layers, Boxes, CircleCheck, RotateCcw } from 'lucide-react';
import { TaskSys1, TaskSys2, TaskSys3 } from '../types';

interface MainDashboardViewProps {
  tasksSys1: TaskSys1[];
  tasksSys2: TaskSys2[];
  tasksSys3: TaskSys3[];
}

export const MainDashboardView: React.FC<MainDashboardViewProps> = ({ tasksSys1, tasksSys2, tasksSys3 }) => {
  const isStatusDone = (statusStr: string) => {
    if (!statusStr) return false;
    return !!statusStr.match(/(สำเร็จ|เรียบร้อย|complete|done)/i);
  };

  const calcStats = (tasks: any[]) => {
    const total = tasks.length;
    const done = tasks.filter(t => isStatusDone(t.status)).length;
    const pending = total - done;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, done, pending, percent };
  };

  const s1 = calcStats(tasksSys1);
  const s2 = calcStats(tasksSys2);
  const s3 = calcStats(tasksSys3);
  
  const overallTotal = s1.total + s2.total + s3.total;
  const overallDone = s1.done + s2.done + s3.done;
  const overallPending = s1.pending + s2.pending + s3.pending;
  const overallPercent = overallTotal === 0 ? 0 : Math.round((overallDone / overallTotal) * 100);

  const SystemCard = ({ title, icon: Icon, colorClass, bgClass, stats }: any) => (
    <div className={`p-6 rounded-2xl border shadow-sm ${bgClass} flex flex-col`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${colorClass} shadow-sm`}>
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-base md:text-lg font-bold text-slate-800">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4 flex-1">
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
          <span className="text-[10px] md:text-xs font-semibold text-slate-500 mb-1">งานทั้งหมด</span>
          <span className="text-2xl font-bold text-slate-800">{stats.total}</span>
        </div>
        <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 shadow-sm flex flex-col items-center justify-center">
          <span className="text-[10px] md:text-xs font-semibold text-emerald-600 mb-1">สำเร็จแล้ว</span>
          <span className="text-2xl font-bold text-emerald-600">{stats.done}</span>
        </div>
        <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100 shadow-sm col-span-2 flex flex-col items-center justify-center">
          <span className="text-[10px] md:text-xs font-semibold text-orange-600 mb-1">กำลังดำเนินการ / ยังไม่เสร็จ</span>
          <span className="text-2xl font-bold text-orange-600">{stats.pending}</span>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-[10px] md:text-xs font-bold mb-1">
          <span className="text-slate-500">ความคืบหน้า</span>
          <span className={stats.percent === 100 ? 'text-emerald-600' : 'text-blue-600'}>{stats.percent}%</span>
        </div>
        <div className="w-full bg-white rounded-full h-2.5 shadow-inner overflow-hidden border border-slate-200">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${stats.percent === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
            style={{ width: `${stats.percent}%` }}
          ></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <header className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center">
            <Home className="w-8 h-8 text-blue-600 mr-3" /> Main Dashboard
          </h2>
          <p className="text-sm text-slate-500 mt-1">สรุปจำนวนงานและสถานะความคืบหน้าเบื้องต้นของทุกระบบ</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 text-white p-5 md:p-6 rounded-2xl shadow-md border border-slate-700 flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs md:text-sm font-semibold text-slate-300 mb-1">รวมงานทั้งหมดในระบบ</p>
            <p className="text-4xl md:text-5xl font-bold">{overallTotal}</p>
          </div>
          <Boxes className="w-16 h-16 opacity-10 absolute right-4 top-1/2 -translate-y-1/2" />
        </div>
        <div className="bg-emerald-50 p-5 md:p-6 rounded-2xl shadow-sm border border-emerald-200 flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs md:text-sm font-semibold text-emerald-600 mb-1">สำเร็จแล้วทั้งหมด</p>
            <p className="text-4xl md:text-5xl font-bold text-emerald-700">{overallDone}</p>
          </div>
          <CircleCheck className="w-16 h-16 opacity-10 text-emerald-800 absolute right-4 top-1/2 -translate-y-1/2" />
        </div>
        <div className="bg-orange-50 p-5 md:p-6 rounded-2xl shadow-sm border border-orange-200 flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs md:text-sm font-semibold text-orange-600 mb-1">กำลังดำเนินการทั้งหมด</p>
            <p className="text-4xl md:text-5xl font-bold text-orange-700">{overallPending}</p>
          </div>
          <RotateCcw className="w-16 h-16 opacity-10 text-orange-800 absolute right-4 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <div className="pt-4">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <Layers className="w-5 h-5 text-slate-400 mr-2" /> แยกตามระบบงาน
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SystemCard title="Region Assignment" icon={UserCog} colorClass="bg-blue-600" bgClass="bg-blue-50/30 border-blue-100" stats={s1} />
          <SystemCard title="Pre Survey" icon={MapPin} colorClass="bg-amber-500" bgClass="bg-amber-50/30 border-amber-100" stats={s2} />
          <SystemCard title="Cross Connect Order" icon={Network} colorClass="bg-emerald-600" bgClass="bg-emerald-50/30 border-emerald-100" stats={s3} />
        </div>
      </div>
    </div>
  );
};
