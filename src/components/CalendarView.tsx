import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, CalendarCheck, CalendarX } from 'lucide-react';
import { MasterData, TaskSys1, TaskSys2, TaskSys3 } from '../types';
import { hexToRgbA, monthNames, parseThaiDateTime } from '../lib/utils';

const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

interface CalendarViewProps {
  systemMode: string;
  tasksSys1: TaskSys1[];
  tasksSys2: TaskSys2[];
  tasksSys3: TaskSys3[];
  masterData: MasterData;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ systemMode, tasksSys1, tasksSys2, tasksSys3, masterData }) => {
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tooltipData, setTooltipData] = useState<{ visible: boolean; task: any; x: number; y: number }>({ visible: false, task: null, x: 0, y: 0 });
  const [visibleSystems, setVisibleSystems] = useState(['sys1', 'sys2', 'sys3']);

  const toggleSystem = (sys: string) => {
    if (visibleSystems.includes(sys)) setVisibleSystems(visibleSystems.filter(s => s !== sys));
    else setVisibleSystems([...visibleSystems, sys]);
  };

  const navigateCalendar = (dir: number) => {
    const nd = new Date(currentDate);
    if (calendarView === 'month') nd.setMonth(nd.getMonth() + dir);
    else if (calendarView === 'week') nd.setDate(nd.getDate() + (dir * 7));
    else nd.setDate(nd.getDate() + dir);
    setCurrentDate(nd);
  };

  const monthSlots = [
    ...Array(getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth())).fill(null),
    ...Array.from({ length: getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth()) }, (_, i) => new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1))
  ];

  const weekSlots = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - d.getDay() + i);
    return d;
  });

  const getTasksForDateObj = (dateObj: Date | null) => {
    if (!dateObj) return [];
    let allTasks: any[] = [];

    if (systemMode === 'sys1' || (systemMode === 'all' && visibleSystems.includes('sys1'))) {
      const mappedSys1 = tasksSys1.filter(t => {
        const tDate = t.installDate ? new Date(t.installDate) : parseThaiDateTime(t.dateTime);
        return tDate && tDate.getDate() === dateObj.getDate() && tDate.getMonth() === dateObj.getMonth() && tDate.getFullYear() === dateObj.getFullYear();
      }).map(t => ({ ...t, _sys: 'sys1', _title: t.customerName || 'No Name', _sub: Array.isArray(t.equipTeams) ? t.equipTeams.join(', ') : '-', _cid: t.cid, _time: t.startTime && t.endTime ? `${t.startTime} - ${t.endTime}` : (t.installDate || t.dateTime.split(' ')[0]) }));
      allTasks = [...allTasks, ...mappedSys1];
    }
    if (systemMode === 'sys2' || (systemMode === 'all' && visibleSystems.includes('sys2'))) {
      const mappedSys2 = tasksSys2.filter(t => {
        const tDate = parseThaiDateTime(t.date);
        return tDate && tDate.getDate() === dateObj.getDate() && tDate.getMonth() === dateObj.getMonth() && tDate.getFullYear() === dateObj.getFullYear();
      }).map(t => ({ ...t, _sys: 'sys2', _title: t.location || 'No Location', _sub: t.surveyor || '-', _cid: t.surveyId, _time: t.date }));
      allTasks = [...allTasks, ...mappedSys2];
    }
    if (systemMode === 'sys3' || (systemMode === 'all' && visibleSystems.includes('sys3'))) {
      const mappedSys3 = tasksSys3.filter(t => {
        const tDate = parseThaiDateTime(t.date);
        return tDate && tDate.getDate() === dateObj.getDate() && tDate.getMonth() === dateObj.getMonth() && tDate.getFullYear() === dateObj.getFullYear();
      }).map(t => ({ ...t, _sys: 'sys3', _title: `CID: ${t.cid || '-'}`, _sub: `${t.fromPort || '-'} -> ${t.toPort || '-'}`, _cid: t.cid, _time: t.date }));
      allTasks = [...allTasks, ...mappedSys3];
    }
    return allTasks;
  };

  const getStatusColorConfig = (statusName: string) => {
    const found = masterData.statuses.find(s => s.name === statusName);
    if (found) return { bg: hexToRgbA(found.bg, 0.15), border: found.bg, text: found.text, solidBg: found.bg };
    return { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569', solidBg: '#94a3b8' };
  };

  const getTeamColorStyle = (teamName: string) => {
    if (!teamName || String(teamName).trim() === '') return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
    const fallbackTeamColors = [{ bg: '#f3e8ff', text: '#7e22ce', border: '#e9d5ff' }, { bg: '#ccfbf1', text: '#0f766e', border: '#99f6e4' }, { bg: '#ffedd5', text: '#c2410c', border: '#fed7aa' }, { bg: '#e0e7ff', text: '#4338ca', border: '#c7d2fe' }, { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' }, { bg: '#ffe4e6', text: '#be123c', border: '#fecdd3' }];
    let str = String(teamName).trim();
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return fallbackTeamColors[Math.abs(hash) % fallbackTeamColors.length];
  };

  const handleMouseMove = (e: React.MouseEvent, task: any) => {
    const tooltipWidth = 260;
    let x = e.clientX + 15, y = e.clientY + 15;
    if (x + tooltipWidth > window.innerWidth) x = e.clientX - tooltipWidth - 15;
    setTooltipData({ visible: true, task, x: Math.max(10, x), y: Math.max(10, y) });
  };
  const handleMouseLeave = () => setTooltipData({ visible: false, task: null, x: 0, y: 0 });

  const calendarTitle = systemMode === 'sys1' ? 'Region Assignment Calendar' : systemMode === 'sys2' ? 'Pre Survey Calendar' : systemMode === 'sys3' ? 'Cross Connect Calendar' : 'Calendar All System';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex flex-col gap-4 mb-4 shrink-0">
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
          <div>
            <h2 className="text-xl md:text-3xl font-bold text-slate-900">{calendarTitle}</h2>
            <p className="text-xs text-slate-500 mt-1">แสดงแผนงานจากระบบตามช่วงเวลาที่กำหนด</p>

            {systemMode === 'all' && (
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">แสดงระบบ:</span>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 shadow-sm transition-colors hover:bg-blue-100 select-none">
                  <input type="checkbox" checked={visibleSystems.includes('sys1')} onChange={() => toggleSystem('sys1')} className="w-3.5 h-3.5 cursor-pointer accent-blue-600" />
                  1. Region Assignment
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100 shadow-sm transition-colors hover:bg-amber-100 select-none">
                  <input type="checkbox" checked={visibleSystems.includes('sys2')} onChange={() => toggleSystem('sys2')} className="w-3.5 h-3.5 cursor-pointer accent-amber-500" />
                  2. Pre Survey
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 shadow-sm transition-colors hover:bg-emerald-100 select-none">
                  <input type="checkbox" checked={visibleSystems.includes('sys3')} onChange={() => toggleSystem('sys3')} className="w-3.5 h-3.5 cursor-pointer accent-emerald-600" />
                  3. Cross Connect Order
                </label>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-3 w-full md:w-auto mt-2 md:mt-0">
            <div className="flex bg-slate-200 p-1 rounded-lg w-full sm:w-auto">
              {(['day', 'week', 'month'] as const).map(view => (
                <button
                  key={view}
                  onClick={() => setCalendarView(view)}
                  className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-md ${calendarView === view ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}
                >
                  {view === 'day' ? 'รายวัน' : view === 'week' ? 'สัปดาห์' : 'เดือน'}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between w-full md:w-auto gap-4">
              <h3 className="text-base md:text-xl font-bold text-blue-700 min-w-[150px] text-right">
                {calendarView === 'month' && `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
                {calendarView === 'week' && `สัปดาห์ที่ ${currentDate.getDate()} ${monthNames[currentDate.getMonth()]}`}
                {calendarView === 'day' && `${currentDate.getDate()} ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
              </h3>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => navigateCalendar(-1)} className="p-1.5 bg-white border rounded-lg hover:bg-slate-50"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setCurrentDate(new Date())} className="px-2 bg-white border rounded-lg hover:bg-slate-50 text-xs font-bold text-slate-700">วันนี้</button>
                <button onClick={() => navigateCalendar(1)} className="p-1.5 bg-white border rounded-lg hover:bg-slate-50"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 shrink-0">
          {['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'].map((d, i) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-slate-600 border-r border-slate-200">
              <span className="md:hidden">{['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'][i]}</span>
              <span className="hidden md:inline">{d}</span>
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-100/50">
          {calendarView === 'month' && (
            <div className="grid grid-cols-7 h-full min-h-[500px] auto-rows-fr">
              {monthSlots.map((dateObj, idx) => {
                const dayTasks = getTasksForDateObj(dateObj);
                return (
                  <div key={idx} className="bg-white p-1 md:p-2 border-r border-b border-slate-200 flex flex-col hover:bg-blue-50/30 overflow-hidden min-h-[100px]">
                    {dateObj && (
                      <>
                        <div className="text-right mb-1">
                          <span
                            className={`inline-block w-6 h-6 leading-6 text-center rounded-full text-xs font-semibold ${dateObj.getDate() === new Date().getDate() && dateObj.getMonth() === new Date().getMonth() ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700 hover:bg-blue-100 hover:text-blue-700 cursor-pointer transition-all'}`}
                            onClick={() => { setCalendarView('day'); setCurrentDate(dateObj); }}
                          >
                            {dateObj.getDate()}
                          </span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1">
                          {dayTasks.map(t => {
                            const conf = getStatusColorConfig(t.status);
                            return (
                              <div key={t.id} className="p-1.5 md:p-2 rounded-lg md:rounded-xl border border-l-2 md:border-l-4 shadow-sm bg-white text-[9px] md:text-xs space-y-1 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: conf.border }} onMouseMove={(e) => handleMouseMove(e, t)} onMouseLeave={handleMouseLeave} onClick={() => { if (window.innerWidth <= 1024) { setCalendarView('day'); setCurrentDate(dateObj); } }}>
                                <div className="flex justify-between items-center mb-0.5"><div className="text-slate-500 font-semibold truncate text-[8px] md:text-[10px]">{t._sub}</div>{systemMode === 'all' && <span className="text-[7px] bg-slate-100 text-slate-400 px-1 rounded uppercase">{t._sys}</span>}</div>
                                <div className="font-bold text-slate-800 leading-tight line-clamp-2" title={t._title}>{t._title}</div>
                                <div className="flex items-center gap-1 text-slate-600 font-medium text-[8px] md:text-[10px] mt-0.5 flex-wrap"><CalendarCheck className="w-3 h-3 text-blue-600" /> {t._time} </div>
                                <div className="mt-1 text-center font-bold px-1 py-0.5 rounded border text-[8px] md:text-[10px] truncate" style={{ backgroundColor: conf.bg, color: conf.border, borderColor: conf.border }}>{t.status || 'No Status'}</div>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {calendarView === 'week' && (
            <div className="grid grid-cols-7 border-l border-slate-200 h-full min-h-[400px]">
              {weekSlots.map((dateObj, idx) => {
                const dayTasks = getTasksForDateObj(dateObj);
                return (
                  <div key={`w-${idx}`} className="bg-white p-1 md:p-2 flex flex-col gap-1.5 md:gap-2 bg-slate-50/30 border-r border-b border-slate-200 h-full overflow-hidden min-h-0">
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1.5 min-h-0">
                      {dayTasks.map(t => {
                        const conf = getStatusColorConfig(t.status);
                        return (
                          <div key={t.id} style={{ borderLeftColor: conf.border }} className="p-1.5 md:p-3 rounded-lg md:rounded-xl border border-l-2 md:border-l-4 shadow-sm bg-white text-[10px] md:text-xs space-y-1 md:space-y-1.5 cursor-pointer hover:shadow-md transition-shadow" onMouseMove={(e) => handleMouseMove(e, t)} onMouseLeave={handleMouseLeave} onClick={() => { if (window.innerWidth <= 1024) { setCalendarView('day'); setCurrentDate(dateObj); } }}>
                            <div className="flex justify-between items-center mb-0.5"><div className="text-slate-500 font-semibold truncate">{t._sub}</div>{systemMode === 'all' && <span className="text-[8px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded uppercase">{t._sys}</span>}</div>
                            <div className="font-bold text-slate-800 break-words leading-tight line-clamp-2">{t._title}</div>
                            <div className="flex items-center gap-1 text-slate-600 font-medium px-1 py-0.5 rounded text-[8px] md:text-[10px] w-fit mt-1"><CalendarCheck className="w-3 h-3 text-blue-600" /> {t._time}</div>
                            <div className="mt-1.5 text-center font-bold px-1 md:px-2 py-0.5 md:py-1 rounded-md md:rounded-lg border text-[8px] md:text-[10px]" style={{ backgroundColor: conf.bg, color: conf.border, borderColor: conf.border }}>{t.status || 'No Status'}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {calendarView === 'day' && (() => {
            const dayTasks = getTasksForDateObj(currentDate);
            return (
              <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col p-4 md:p-6 min-h-0 overflow-hidden h-full">
                <h4 className="text-base md:text-lg font-bold text-slate-800 mb-4 md:mb-6 border-b pb-3 md:pb-4 flex justify-between items-center shrink-0">
                  <span className="flex items-center gap-2"><CalendarDays className="w-5 h-5 text-blue-600" /> ตารางงานประจำวัน</span>
                  <span className="text-xs md:text-sm font-medium bg-blue-100 text-blue-700 px-3 md:px-4 py-1 md:py-1.5 rounded-full shadow-sm">{dayTasks.length} งาน</span>
                </h4>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
                  {dayTasks.length === 0 ? (
                    <div className="text-center text-slate-400 py-12 md:py-20 flex flex-col items-center">
                      <CalendarX className="w-16 h-16 mb-4 text-slate-200" />
                      <p className="text-sm md:text-lg font-medium">ไม่มีแผนงานในวันนี้</p>
                    </div>
                  ) : (
                    <div className="space-y-3 md:space-y-4">
                      {dayTasks.map(t => {
                        const conf = getStatusColorConfig(t.status);
                        const teamColor = getTeamColorStyle(t._sub.split(',')[0]);
                        return (
                          <div key={t.id} className="flex bg-white rounded-xl md:rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer relative" onMouseMove={(e) => handleMouseMove(e, t)} onMouseLeave={handleMouseLeave}>
                            <div style={{ backgroundColor: conf.solidBg }} className="w-2 md:w-3 shrink-0"></div>
                            <div className="p-3 md:p-4 flex-1 flex flex-col text-xs md:text-sm min-w-0">
                              <div className="flex flex-col lg:flex-row gap-3 md:gap-4 lg:items-center w-full min-w-0">
                                <div className="flex-1 flex flex-col lg:flex-row gap-3 lg:gap-4 lg:items-center min-w-0">
                                  <div className="flex flex-col justify-center items-start shrink-0 lg:pr-4 lg:border-r border-slate-200">
                                    <p className="text-[10px] md:text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">รายละเอียดทีม / งาน</p>
                                    <div className="px-2 py-1 md:py-1.5 rounded-md text-sm md:text-base font-bold border w-32 md:w-40 text-center truncate shadow-sm" style={{ backgroundColor: teamColor.bg, color: teamColor.text, borderColor: teamColor.border }} title={t._sub}>{t._sub}</div>
                                  </div>
                                  <div className="flex-1 flex flex-col justify-center overflow-hidden min-w-0 lg:pr-2">
                                    <p className="text-[10px] md:text-xs text-slate-400 font-semibold uppercase tracking-wider">ชื่อรายการ / ลูกค้า</p>
                                    <p className="font-bold text-slate-800 text-sm md:text-base leading-tight truncate mt-0.5" title={t._title}>{t._cid && <span className="text-blue-600 mr-1">[{t._cid}]</span>}<span>{t._title}</span></p>
                                  </div>
                                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 shrink-0 lg:pl-2">
                                    <div className="flex flex-col justify-center shrink-0">
                                      <p className="text-[10px] md:text-xs text-slate-400 font-semibold uppercase tracking-wider">วันเวลา (Date/Time)</p>
                                      <div className="flex items-center gap-2 mt-0.5 text-sm md:text-base font-bold text-slate-700">
                                        <p className="flex items-center gap-1"><CalendarCheck className="w-4 h-4 text-blue-600" /> {t._time}</p>
                                      </div>
                                    </div>
                                    {systemMode === 'all' && <div className="flex flex-col justify-center shrink-0"><p className="text-[10px] md:text-xs text-slate-400 font-semibold uppercase tracking-wider">ระบบ</p><p className="mt-0.5 text-sm md:text-base font-bold text-slate-500 uppercase">{t._sys}</p></div>}
                                  </div>
                                </div>
                                <div className="flex justify-start lg:justify-end mt-2 lg:mt-0 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 pt-3 lg:pt-0 lg:pl-4">
                                  <span style={{ backgroundColor: conf.bg, color: conf.border, borderColor: conf.border }} className="font-bold px-4 md:px-6 py-1.5 md:py-2 rounded-lg md:rounded-xl border-2 text-center min-w-[120px] md:min-w-[140px] shadow-sm">{t.status || 'No Status'}</span>
                                </div>
                              </div>
                              {t.remark && <div className="mt-3 pt-3 border-t border-slate-100 w-full"><p className="text-[10px] md:text-xs text-amber-600 font-semibold uppercase tracking-wider">หมายเหตุเพิ่มเติม</p><p className="text-slate-600 text-xs mt-0.5 break-words">{t.remark}</p></div>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {tooltipData.visible && tooltipData.task && (
          <div className="fixed z-[9999] bg-white p-4 rounded-xl shadow-2xl border border-blue-200 w-[260px] pointer-events-none" style={{ left: tooltipData.x, top: tooltipData.y }}>
            <div className="flex justify-between items-start mb-2 border-b pb-2"><h4 className="font-bold text-slate-800 text-sm truncate pr-2">{tooltipData.task._title}</h4><span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase shrink-0">{tooltipData.task._sys}</span></div>
            <div className="text-xs space-y-1.5 text-slate-600">
              <p><span className="font-semibold text-slate-400">ID / CID:</span> <span className="text-blue-600 font-bold">{tooltipData.task._cid || '-'}</span></p>
              <p><span className="font-semibold text-slate-400">ผู้รับผิดชอบ:</span> {tooltipData.task._sub}</p>
              <p><span className="font-semibold text-slate-400">วันที่:</span> {tooltipData.task._time}</p>
              <p><span className="font-semibold text-slate-400">สถานะ:</span> <span className="font-bold" style={{ color: getStatusColorConfig(tooltipData.task.status).text }}>{tooltipData.task.status || 'ไม่มี'}</span></p>
              {tooltipData.task.scopeOfWork && <p><span className="font-semibold text-slate-400">Scope:</span> {tooltipData.task.scopeOfWork === 'อื่นๆ (Other)' && tooltipData.task.otherScopeDetail ? `อื่นๆ: ${tooltipData.task.otherScopeDetail}` : tooltipData.task.scopeOfWork}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
