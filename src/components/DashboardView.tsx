import React, { useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, ChartData } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { PieChart, BarChart3, Users, CircleCheck } from 'lucide-react';
import { MasterData, TaskSys1 } from '../types';
import { hexToRgbA, monthNames, parseThaiDateTime } from '../lib/utils';
import { MultiSelect } from './MultiSelect';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, ChartDataLabels);

interface DashboardViewProps {
  systemMode: string;
  tasksSys1: TaskSys1[];
  masterData: MasterData;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ systemMode, tasksSys1, masterData }) => {
  const [filterMonth, setFilterMonth] = useState('All');
  const [filterTeams, setFilterTeams] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  if (systemMode !== 'sys1') {
    const isSys2 = systemMode === 'sys2';
    return (
      <div className={`p-10 rounded-2xl font-bold border text-center shadow-sm max-w-3xl mx-auto mt-10 ${isSys2 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
        {isSys2 ? <PieChart className="w-16 h-16 mx-auto mb-4 opacity-80" /> : <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-80" />}
        <h3 className="text-2xl">{isSys2 ? 'Pre Survey Dashboard' : 'Cross Connect Order Dashboard'}</h3>
        <p className="font-normal mt-2 opacity-80">ส่วนนี้ยังไม่มีกราฟแสดงผล เนื่องจากโครงสร้างข้อมูลยังไม่สมบูรณ์</p>
      </div>
    );
  }

  const getStatusColorConfig = (statusName: string) => {
    const found = masterData.statuses.find(s => s.name === statusName);
    if (found) return { bg: hexToRgbA(found.bg, 0.8), border: found.bg, text: found.text, soft: hexToRgbA(found.bg, 0.15) };
    return { bg: 'rgba(203, 213, 225, 0.8)', border: '#64748b', text: '#64748b', soft: '#f1f5f9' };
  };

  const monthLabels = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

  const uniqueMonths = [...new Set(tasksSys1.map(t => {
    const d = t.installDate ? new Date(t.installDate) : parseThaiDateTime(t.dateTime);
    if (d) {
      const m = d.getMonth();
      return m + 1;
    }
    return null;
  }).filter((m): m is number => m !== null))].sort((a, b) => (Number(a) - Number(b)));

  const uniqueTeams = masterData.equipTeams;

  let filteredTasks = tasksSys1.filter(t => {
    let mMatch = true, tMatch = true;
    const d = t.installDate ? new Date(t.installDate) : parseThaiDateTime(t.dateTime);
    if (filterMonth !== 'All' && d) {
      const monthNumber = d.getMonth() + 1;
      if (monthNumber !== parseInt(filterMonth, 10)) mMatch = false;
    }
    if (filterTeams.length > 0) {
      const taskTeams = Array.isArray(t.equipTeams) ? t.equipTeams : [];
      if (!taskTeams.some(team => filterTeams.includes(team))) tMatch = false;
    }
    return mMatch && tMatch;
  });

  const chartFilteredTasks = filteredTasks.filter(t => selectedStatuses.length === 0 || selectedStatuses.includes(t.status));
  const totalTasksCount = filteredTasks.length;

  const statusCounts: Record<string, number> = {};
  masterData.statuses.forEach(s => statusCounts[s.name] = 0);
  filteredTasks.forEach(t => {
    if (statusCounts[t.status] !== undefined) statusCounts[t.status]++;
    else statusCounts[t.status] = 1;
  });
  const sortedStatuses = Object.keys(statusCounts);

  const doughnutCounts: Record<string, number> = {};
  chartFilteredTasks.forEach(t => { doughnutCounts[t.status] = (doughnutCounts[t.status] || 0) + 1; });
  const doughnutLabels = Object.keys(doughnutCounts);

  const statusChartData: ChartData<'doughnut'> = {
    labels: doughnutLabels,
    datasets: [{
      data: doughnutLabels.map(s => doughnutCounts[s]),
      backgroundColor: doughnutLabels.map(s => getStatusColorConfig(s).bg),
      borderColor: doughnutLabels.map(s => getStatusColorConfig(s).border),
      borderWidth: 2,
      hoverOffset: 6,
      borderRadius: 4
    }]
  };

  const statusChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%' as const,
    plugins: {
      legend: { display: false },
      datalabels: { display: false }
    }
  };

  const monthlyData: Record<number, { done: number, ongoing: number }> = {};
  for (let i = 1; i <= 12; i++) monthlyData[i] = { done: 0, ongoing: 0 };
  chartFilteredTasks.forEach(t => {
    const d = t.installDate ? new Date(t.installDate) : parseThaiDateTime(t.dateTime);
    if (d) {
      const m = d.getMonth() + 1;
      if (m >= 1 && m <= 12) {
        if (t.status.includes('สำเร็จ')) monthlyData[m].done++;
        else monthlyData[m].ongoing++;
      }
    }
  });

  const dlStyle: any = {
    color: '#ffffff',
    font: { weight: 'bold' as const, size: 12, family: 'Prompt' },
    display: (c: any) => c.dataset.data[c.dataIndex] > 0,
    textStrokeColor: 'rgba(15, 23, 42, 0.85)',
    textStrokeWidth: 4
  };

  const barChartData: ChartData<'bar'> = {
    labels: monthLabels,
    datasets: [
      { label: 'สำเร็จ (Done)', data: Object.values(monthlyData).map(d => d.done), backgroundColor: 'rgba(16, 185, 129, 0.8)', borderRadius: 4 },
      { label: 'กำลังดำเนินการ (Ongoing)', data: Object.values(monthlyData).map(d => d.ongoing), backgroundColor: 'rgba(59, 130, 246, 0.8)', borderRadius: 4 }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      datalabels: dlStyle
    },
    scales: { y: { beginAtZero: true } }
  };

  const activeTeams = [...new Set(chartFilteredTasks.flatMap(t => t.equipTeams || []))] as string[];
  const activeStatusesForTeam = [...new Set(chartFilteredTasks.map(t => t.status))] as string[];
  const teamChartData: ChartData<'bar'> = {
    labels: activeTeams,
    datasets: activeStatusesForTeam.map(status => ({
      label: status,
      data: activeTeams.map(team => chartFilteredTasks.filter(t => (t.equipTeams || []).includes(team) && t.status === status).length),
      backgroundColor: getStatusColorConfig(status).bg,
      borderColor: getStatusColorConfig(status).border,
      borderWidth: 1
    }))
  };

  const teamChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const },
      datalabels: dlStyle
    },
    scales: { x: { stacked: false }, y: { beginAtZero: true } }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between md:items-start gap-4">
        <div>
          <h2 className="text-xl md:text-3xl font-bold text-slate-900">Region Assignment Dashboard</h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1">สรุปข้อมูลจากระบบ Region Assignment (อิงจากวันที่ติดตั้ง)</p>
        </div>
        <div className="flex flex-wrap gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-200 items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">เดือนติดตั้ง:</label>
            <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs bg-white outline-none">
              <option value="All">ทั้งหมด</option>
              {uniqueMonths.map(m => {
                const idx = (Number(m) - 1) as number;
                return <option key={m} value={String(m)}>{monthNames[idx]}</option>;
              })}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">ทีมอุปกรณ์:</label>
            <MultiSelect options={uniqueTeams} selected={filterTeams} onChange={setFilterTeams} placeholder="ทีมงาน" />
          </div>
        </div>
      </header>

      <div className="flex flex-nowrap overflow-x-auto gap-3 md:gap-4 pb-2 px-1 custom-scrollbar">
        <div className="bg-slate-800 text-white p-3 md:p-4 rounded-xl shadow-md border border-slate-700 flex-shrink-0 min-w-[140px] flex flex-col items-center justify-center gap-2">
          <p className="text-xs font-semibold text-slate-300">จำนวนงานทั้งหมด</p>
          <p className="text-3xl md:text-5xl font-bold">{totalTasksCount}</p>
        </div>
        {sortedStatuses.map(status => {
          const isSelected = selectedStatuses.length === 0 || selectedStatuses.includes(status);
          const conf = getStatusColorConfig(status);
          return (
            <div
              key={status}
              onClick={() => setSelectedStatuses(selectedStatuses.includes(status) ? selectedStatuses.filter(s => s !== status) : [...selectedStatuses, status])}
              className={`p-3 md:p-4 rounded-xl shadow-md border-b-4 cursor-pointer transition-all duration-200 select-none flex-shrink-0 min-w-[140px] flex flex-col justify-between ${isSelected ? 'scale-100 ring-2 ring-offset-2' : 'scale-95 opacity-70 hover:opacity-100'}`}
              style={{ backgroundColor: isSelected ? conf.soft : '#ffffff', borderColor: conf.border, '--tw-ring-color': conf.border } as any}
            >
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold truncate pr-2" style={{ color: conf.text }}>{status}</p>
                {isSelected && selectedStatuses.length > 0 && <CircleCheck className="w-3 h-3" style={{ color: conf.text }} />}
              </div>
              <p className="text-2xl md:text-4xl font-bold mt-2" style={{ color: conf.text }}>{statusCounts[status]}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-1 flex flex-col relative">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold flex items-center gap-2"><PieChart className="w-5 h-5 text-blue-600" /> สัดส่วนสถานะงาน</h3>
          </div>
          <div className="relative flex-1 w-full flex flex-col items-center justify-center min-h-[250px]">
            {chartFilteredTasks.length > 0 ? (
              <div className="relative mx-auto w-48 h-48">
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-extrabold text-slate-800">{chartFilteredTasks.length}</span>
                  <span className="text-xs font-bold text-slate-500 mt-1">CIDs</span>
                </div>
                <Doughnut data={statusChartData} options={statusChartOptions} />
              </div>
            ) : <p className="text-slate-400">ไม่มีข้อมูล</p>}
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-600" /> สรุปแผนปฏิบัติงานรายเดือน</h3>
          <div className="relative h-60 w-full">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-3">
          <h3 className="text-base font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" /> ปริมาณงานแยกตามทีม</h3>
          <div className="relative h-64 w-full overflow-x-auto custom-scrollbar">
            <div className="min-w-[600px] h-full">
              {chartFilteredTasks.length > 0 ? <Bar data={teamChartData} options={teamChartOptions} /> : <p className="text-center mt-20">ไม่มีข้อมูล</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
