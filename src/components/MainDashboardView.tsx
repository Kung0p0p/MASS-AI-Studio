import React from 'react';
import { Home, UserCog, MapPin, Network, Layers, Boxes, CircleCheck, RotateCcw, CalendarDays, Clock, ChevronRight } from 'lucide-react';
import { TaskSys1, TaskSys2, TaskSys3, MasterData } from '../types';
import { parseThaiDateTime } from '../lib/utils';

interface MainDashboardViewProps {
  tasksSys1: TaskSys1[];
  tasksSys2: TaskSys2[];
  tasksSys3: TaskSys3[];
  masterData: MasterData;
}

export const MainDashboardView: React.FC<MainDashboardViewProps> = ({ tasksSys1, tasksSys2, tasksSys3, masterData }) => {
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

  // Helper to check if a date string is today
  const isToday = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = parseThaiDateTime(dateStr) || new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  const todayTasks: any[] = [
    ...tasksSys1.filter(t => isToday(t.installDate)).map(t => ({ ...t, system: 'Region Assignment', color: 'blue', icon: UserCog })),
    ...tasksSys2.filter(t => isToday(t.date)).map(t => ({ ...t, system: 'Pre Survey', color: 'amber', icon: MapPin })),
    ...tasksSys3.filter(t => isToday(t.date)).map(t => ({ ...t, system: 'Cross Connect', color: 'emerald', icon: Network })),
  ];

  // Simple sort by time if possible
  todayTasks.sort((a, b) => {
    const timeA = a.startTime || a.time || '00:00';
    const timeB = b.startTime || b.time || '00:00';
    return timeA.localeCompare(timeB);
  });

  const SystemCard = ({ title, icon: Icon, colorClass, bgClass, stats }: any) => (
    <div className={`p-6 rounded-2xl border shadow-sm ${bgClass} flex flex-col h-full`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${colorClass} shadow-sm`}>
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-base md:text-lg font-bold text-slate-800 line-clamp-1">{title}</h3>
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
          <span className="text-[10px] md:text-xs font-semibold text-orange-600 mb-1">รอดำเนินการ</span>
          <span className="text-2xl font-bold text-orange-600">{stats.pending}</span>
        </div>
      </div>
      <div className="mt-auto">
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

  const getStatusColor = (statusName: string) => {
    const found = masterData.statuses.find(s => s.name === statusName);
    return found ? { bg: found.bg, text: found.text } : { bg: '#cbd5e1', text: '#1e293b' };
  };

  return (
    <div className="space-y-6 w-full">
      <header className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center">
            <Home className="w-8 h-8 text-blue-600 mr-3" /> Main Dashboard
          </h2>
          <p className="text-sm text-slate-500 mt-1">สรุปจำนวนงานและสถานะความคืบหน้าเบื้องต้นของทุกระบบ</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <CalendarDays className="w-5 h-5 text-blue-500" />
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">วันนี้</p>
            <p className="text-sm font-bold text-slate-800">{new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
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
          <CircleCheck className="w-16 h-16 opacity-10 text-orange-800 absolute right-4 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <CalendarDays className="w-5 h-5 text-blue-500 mr-2" /> แผนงานประจำวัน (Daily Schedule)
              </h3>
              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                {todayTasks.length} งานวันนี้
              </span>
            </div>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {todayTasks.length > 0 ? todayTasks.map((task, idx) => {
                const statusTheme = getStatusColor(task.status);
                const Icon = task.icon;
                return (
                  <div key={`${task.id || idx}`} className="group flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all">
                    <div className="flex-shrink-0 w-16 text-center">
                      <p className="text-xs font-bold text-slate-500 flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> {task.startTime || task.time || 'N/A'}
                      </p>
                    </div>
                    <div className="w-px h-10 bg-slate-200 group-hover:bg-blue-200"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-3 h-3 text-${task.color}-500`} />
                        <span className={`text-[10px] font-bold text-${task.color}-600 uppercase`}>{task.system}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 truncate">{task.cid || task.siteName || task.nodeName || 'ไม่ระบุชื่อ'}</h4>
                      <p className="text-xs text-slate-500 truncate">{task.scopeOfWork || task.siteCode || task.pointName || '-'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span 
                        className="px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm"
                        style={{ backgroundColor: statusTheme.bg, color: statusTheme.text }}
                      >
                        {task.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                );
              }) : (
                <div className="py-10 text-center flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <CalendarDays className="w-12 h-12 text-slate-300 mb-2" />
                  <p className="text-slate-400 font-medium">ไม่มีงานที่วางแผนไว้สำหรับวันนี้</p>
                </div>
              )}
            </div>
          </div>

          <div>
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

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white">
            <h4 className="font-bold text-lg mb-2">สรุปภาพรวมระบบ</h4>
            <p className="text-blue-100 text-sm mb-4">ระบบจัดการและติดตามงานเทคนิคแบบเรียลไทม์ (MASS)</p>
            <div className="space-y-4">
              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                <p className="text-xs font-bold text-blue-200 mb-1">ความคืบหน้าภาพรวม</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white/20 h-2 rounded-full overflow-hidden">
                    <div className="bg-white h-full transition-all duration-500" style={{ width: `${overallPercent}%` }}></div>
                  </div>
                  <span className="text-lg font-bold">{overallPercent}%</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/20 p-3 rounded-xl border border-emerald-500/30">
                  <p className="text-[10px] font-bold text-emerald-200 uppercase">ทำเสร็จแล้ว</p>
                  <p className="text-2xl font-bold">{overallDone}</p>
                </div>
                <div className="bg-orange-500/20 p-3 rounded-xl border border-orange-500/30">
                  <p className="text-[10px] font-bold text-orange-200 uppercase">งานที่ค้างอยู่</p>
                  <p className="text-2xl font-bold">{overallPending}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-500">
               <RotateCcw className="w-12 h-12 text-blue-100" />
            </div>
            <h4 className="font-bold text-slate-800 mb-1 relative z-10">Last Update</h4>
            <p className="text-xs text-slate-500 relative z-10">อัปเดตข้อมูลล่าสุดเมื่อ</p>
            <p className="text-xl font-bold text-blue-600 mt-2 relative z-10">
              {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

