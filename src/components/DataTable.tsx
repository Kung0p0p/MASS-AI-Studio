import React, { useState, useMemo } from 'react';
import { Search, Plus, Pin, SortAsc, SortDesc, ArrowUpDown, Eraser, PenLine, ChevronDown } from 'lucide-react';
import { MasterData } from '../types';
import { hexToRgbA } from '../lib/utils';

interface Column {
  label: string;
  key: string;
}

interface DataTableProps {
  title: string;
  columns: Column[];
  data: any[];
  masterData: MasterData;
  onAddClick?: () => void;
  addLabel?: string;
  btnClass?: string;
  onUpdateTask?: (id: string, key: string, val: any) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  title,
  columns,
  data,
  masterData,
  onAddClick,
  addLabel = "เพิ่มข้อมูล",
  btnClass = "bg-blue-600 hover:bg-blue-700",
  onUpdateTask
}) => {
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' | null }>({ key: null, direction: null });
  const [pinnedColumns, setPinnedColumns] = useState<string[]>([]);
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({ scopeOfWork: '', equipTeams: '', fiberTeams: '', configTeam: '', pmTeam: '', status: '' });
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(50);

  const getStatusColor = (statusName: string) => {
    const found = masterData.statuses.find(s => s.name === statusName);
    if (found) return { bg: hexToRgbA(found.bg, 0.15), text: found.text, border: found.bg };
    return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
  };

  const processedData = useMemo(() => {
    let items = [...data];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      items = items.filter(item => Object.values(item).some(val => {
        if (Array.isArray(val)) return val.join(' ').toLowerCase().includes(lowerSearch);
        return String(val || '').toLowerCase().includes(lowerSearch);
      }));
    }

    if (filters.scopeOfWork) items = items.filter(i => {
      let s = i.scopeOfWork === 'อื่นๆ (Other)' && i.otherScopeDetail ? `อื่นๆ: ${i.otherScopeDetail}` : i.scopeOfWork;
      if (filters.scopeOfWork === 'อื่นๆ (Other)') return i.scopeOfWork === 'อื่นๆ (Other)';
      return s === filters.scopeOfWork;
    });
    if (filters.configTeam) items = items.filter(i => i.configTeam === filters.configTeam);
    if (filters.pmTeam) items = items.filter(i => i.pmTeam === filters.pmTeam);
    if (filters.status) items = items.filter(i => i.status === filters.status);

    if (filters.equipTeams) {
      items = items.filter(i => {
        const m = Array.isArray(i.equipTeams) ? i.equipTeams : [];
        const s = Array.isArray(i.equipTeamsSub) ? i.equipTeamsSub : [];
        return m.includes(filters.equipTeams) || s.includes(filters.equipTeams);
      });
    }
    if (filters.fiberTeams) {
      items = items.filter(i => Array.isArray(i.fiberTeams) ? i.fiberTeams.includes(filters.fiberTeams) : i.fiberTeams === filters.fiberTeams);
    }

    if (sortConfig.key !== null) {
      items.sort((a, b) => {
        let aVal = a[sortConfig.key!];
        let bVal = b[sortConfig.key!];

        if (sortConfig.key === 'timeRange') {
          aVal = a.startTime && a.endTime ? `${a.startTime} - ${a.endTime}` : '';
          bVal = b.startTime && b.endTime ? `${b.startTime} - ${b.endTime}` : '';
        } else if (sortConfig.key === 'scopeOfWork') {
          aVal = a.scopeOfWork === 'อื่นๆ (Other)' && a.otherScopeDetail ? `อื่นๆ: ${a.otherScopeDetail}` : a.scopeOfWork;
          bVal = b.scopeOfWork === 'อื่นๆ (Other)' && b.otherScopeDetail ? `อื่นๆ: ${b.otherScopeDetail}` : b.scopeOfWork;
        } else {
          if (Array.isArray(aVal)) aVal = aVal.join(', ');
          if (Array.isArray(bVal)) bVal = bVal.join(', ');
        }

        aVal = String(aVal || '');
        bVal = String(bVal || '');
        return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal, 'th', { numeric: true }) : bVal.localeCompare(aVal, 'th', { numeric: true });
      });
    }
    return items;
  }, [data, sortConfig, searchTerm, filters, masterData]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const orderedColumns = useMemo(() => {
    const pinned = columns.filter(c => pinnedColumns.includes(c.key));
    const unpinned = columns.filter(c => !pinnedColumns.includes(c.key));
    return [...pinned, ...unpinned];
  }, [columns, pinnedColumns]);

  const handlePinToggle = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    setPinnedColumns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    if (!colWidths[key]) {
      const th = (e.currentTarget as HTMLElement).closest('th');
      if (th) setColWidths(prev => ({ ...prev, [key]: Math.max(120, th.getBoundingClientRect().width) }));
    }
  };

  const getColWidth = (key: string) => colWidths[key] || 150;
  const getPinnedLeftPos = (key: string) => {
    let left = 0;
    const targetIdx = orderedColumns.findIndex(c => c.key === key);
    for (let i = 0; i < targetIdx; i++) {
      if (pinnedColumns.includes(orderedColumns[i].key)) left += getColWidth(orderedColumns[i].key);
    }
    return left;
  };

  const handlePointerDown = (e: React.PointerEvent | React.TouchEvent, key: string) => {
    e.preventDefault(); e.stopPropagation();
    const startX = 'pageX' in e ? e.pageX : e.touches[0].pageX;
    const th = (e.currentTarget as HTMLElement).closest('th');
    const startWidth = th ? th.getBoundingClientRect().width : 150;

    const onPointerMove = (me: PointerEvent) => {
      const currentX = me.pageX;
      setColWidths(prev => ({ ...prev, [key]: Math.max(60, startWidth + (currentX - startX)) }));
    };
    const onTouchMove = (te: TouchEvent) => {
        const currentX = te.touches[0].pageX;
        setColWidths(prev => ({ ...prev, [key]: Math.max(60, startWidth + (currentX - startX)) }));
    }
    const onPointerUp = () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onPointerUp);
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onPointerUp);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilters({ scopeOfWork: '', equipTeams: '', fiberTeams: '', configTeam: '', pmTeam: '', status: '' });
    setSortConfig({ key: null, direction: null });
    setDisplayLimit(50);
  };

  const visibleData = useMemo(() => {
    return processedData.slice(0, displayLimit);
  }, [processedData, displayLimit]);

  const loadMore = () => {
    if (displayLimit < processedData.length) {
      setDisplayLimit(prev => prev + 50);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      loadMore();
    }
  };

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col min-h-0 overflow-hidden relative">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            {onAddClick && (
              <button onClick={onAddClick} className={`${btnClass} text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-transform active:scale-95 flex items-center gap-2`}>
                <Plus className="w-4 h-4" /> <span className="hidden sm:inline">{addLabel}</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-white p-2 border border-slate-200 rounded-xl shadow-sm">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="ค้นหาข้อมูลในตาราง..." className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500" />
          </div>

          {columns.some(c => c.key === 'scopeOfWork') && (
            <select value={filters.scopeOfWork} onChange={e => setFilters({ ...filters, scopeOfWork: e.target.value })} className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs outline-none bg-slate-50 text-slate-700">
              <option value="">-- Scope --</option>
              {masterData.scopeOfWorks.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          )}
          {columns.some(c => c.key === 'equipTeams') && (
            <select value={filters.equipTeams} onChange={e => setFilters({ ...filters, equipTeams: e.target.value })} className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs outline-none bg-slate-50 text-slate-700">
              <option value="">-- Region Responsible --</option>
              {masterData.equipTeams.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          {columns.some(c => c.key === 'fiberTeams') && (
            <select value={filters.fiberTeams} onChange={e => setFilters({ ...filters, fiberTeams: e.target.value })} className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs outline-none bg-slate-50 text-slate-700">
              <option value="">-- Fiber Responsible --</option>
              {masterData.fiberTeams.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          {columns.some(c => c.key === 'configTeam') && (
            <select value={filters.configTeam} onChange={e => setFilters({ ...filters, configTeam: e.target.value })} className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs outline-none bg-slate-50 text-slate-700">
              <option value="">-- Config Responsible --</option>
              {masterData.configTeams.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          {columns.some(c => c.key === 'pmTeam') && (
            <select value={filters.pmTeam} onChange={e => setFilters({ ...filters, pmTeam: e.target.value })} className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs outline-none bg-slate-50 text-slate-700">
              <option value="">-- PM --</option>
              {masterData.pmTeams.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          {columns.some(c => c.key === 'status') && (
            <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs outline-none bg-slate-50 text-slate-700">
              <option value="">-- Status --</option>
              {masterData.statuses.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          )}
          <button onClick={resetFilters} className="text-[10px] bg-red-50 text-red-600 border border-red-200 hover:bg-red-500 hover:text-white px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1">
            <Eraser className="w-3 h-3" />ล้าง
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto table-container relative" onScroll={handleScroll}>
        <table className="w-full text-left border-collapse text-sm relative" style={{ tableLayout: 'fixed', minWidth: 'max-content' }}>
          <thead className="bg-slate-800 shadow-sm sticky top-0 z-40">
            <tr>
              {orderedColumns.map((col) => {
                const isPinned = pinnedColumns.includes(col.key);
                const isLastPinned = isPinned && col.key === pinnedColumns[pinnedColumns.length - 1];
                const colWidth = getColWidth(col.key);

                let thStyle: React.CSSProperties = { width: colWidth, minWidth: colWidth, maxWidth: colWidth };
                if (isPinned) {
                  thStyle.position = 'sticky';
                  thStyle.left = getPinnedLeftPos(col.key);
                  thStyle.zIndex = 50;
                }

                let thClass = `p-0 align-middle relative group transition-colors select-none sortable-header bg-slate-800 border-r border-slate-700 hover:bg-slate-700`;
                if (isLastPinned) thClass += ` shadow-[4px_0_6px_-1px_rgba(0,0,0,0.3)] border-r-slate-500`;

                return (
                  <th key={col.key} className={thClass} style={thStyle}>
                    <div className="flex items-center justify-between px-3 py-3 w-full h-full cursor-pointer" onClick={() => requestSort(col.key)}>
                      <div className="flex items-center gap-2 overflow-hidden w-full">
                        <div className="th-content text-xs font-semibold text-white truncate">{col.label}</div>
                        <button onClick={(e) => handlePinToggle(e, col.key)} className={`shrink-0 hover:scale-125 transition-transform ${isPinned ? 'text-blue-400' : 'text-slate-500 hover:text-white'}`} title="ตรึงคอลัมน์">
                          <Pin className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="ml-1 text-white opacity-70 shrink-0 text-[10px]">
                        {sortConfig.key === col.key ? (sortConfig.direction === 'asc' ? <SortAsc className="w-3 h-3 text-blue-400" /> : <SortDesc className="w-3 h-3 text-blue-400" />) : <ArrowUpDown className="w-3 h-3 opacity-30" />}
                      </div>
                    </div>
                    <div onPointerDown={(e) => handlePointerDown(e, col.key)} onClick={(e) => e.stopPropagation()} className="absolute right-0 top-0 bottom-0 w-4 cursor-col-resize z-10 hover:bg-blue-500 flex flex-col justify-center items-center transition-colors opacity-0 group-hover:opacity-100">
                      <div className="w-[2px] h-4 bg-white/60 rounded-full pointer-events-none"></div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {visibleData.length === 0 ? (
              <tr><td colSpan={orderedColumns.length} className="p-8 text-center text-slate-500">ไม่มีข้อมูลที่ตรงกับการค้นหา</td></tr>
            ) : (
              visibleData.map((row) => (
                <tr key={row.id} className="hover:bg-blue-50/50 transition-colors bg-white">
                  {orderedColumns.map((col, cIdx) => {
                    const isPinned = pinnedColumns.includes(col.key);
                    const isLastPinned = isPinned && col.key === pinnedColumns[pinnedColumns.length - 1];
                    const colWidth = getColWidth(col.key);

                    let tdStyle: React.CSSProperties = { width: colWidth, minWidth: colWidth, maxWidth: colWidth, verticalAlign: 'middle' };
                    if (isPinned) {
                      tdStyle.position = 'sticky';
                      tdStyle.left = getPinnedLeftPos(col.key);
                      tdStyle.zIndex = 20;
                    }

                    let tdClass = `px-3 py-2 align-middle border-r border-slate-100 truncate`;
                    if (isPinned) {
                      tdClass += ` sticky-col-cell bg-white group-hover:bg-blue-50/50`;
                      if (isLastPinned) tdClass += ` shadow-[4px_0_6px_-1px_rgba(0,0,0,0.1)] border-r-slate-300`;
                    }

                    const val = row[col.key];
                    let displayVal = val || '-';

                    if (col.key === 'timeRange') {
                      displayVal = row.startTime && row.endTime ? `${row.startTime} - ${row.endTime}` : '-';
                    } else if (col.key === 'scopeOfWork' && val === 'อื่นๆ (Other)' && row.otherScopeDetail) {
                      displayVal = `อื่นๆ: ${row.otherScopeDetail}`;
                    } else if (col.key === 'equipTeams') {
                      const main = row.equipTeams || [];
                      const sub = row.equipTeamsSub || [];
                      const parts = [];
                      if (main.length) parts.push(`Main: ${main.join(', ')}`);
                      if (sub.length) parts.push(`Sub: ${sub.join(', ')}`);
                      displayVal = parts.length > 0 ? parts.join(' | ') : '-';
                    } else if (col.key === 'fiberTeams') {
                      const main = row.fiberTeams || [];
                      displayVal = main.length > 0 ? main.join(', ') : '-';
                    } else if (Array.isArray(val)) {
                      displayVal = val.join(', ');
                    }

                    const isDropdownCol = ['status', 'configTeam', 'pmTeam', 'scopeOfWork'].includes(col.key);
                    if (isDropdownCol) {
                      let options: string[] = [];
                      if (col.key === 'status') options = masterData.statuses.map(s => s.name);
                      else if (col.key === 'configTeam') options = masterData.configTeams;
                      else if (col.key === 'pmTeam') options = masterData.pmTeams;
                      else if (col.key === 'scopeOfWork') options = masterData.scopeOfWorks.map(s => s.name);

                      return (
                        <td key={cIdx} className={`${tdClass} text-center relative group`} style={tdStyle} title={String(displayVal)}>
                          <div className="relative w-full h-full flex items-center justify-center cursor-pointer min-h-[24px]">
                            {col.key === 'status' ? (
                              <span
                                className="px-2 py-1 rounded-md text-[10px] md:text-xs font-bold border block truncate w-full group-hover:opacity-80 transition-opacity"
                                style={{ backgroundColor: getStatusColor(val).bg, color: getStatusColor(val).text, borderColor: getStatusColor(val).border }}
                              >
                                {displayVal}
                              </span>
                            ) : (
                              <span className="truncate w-full text-xs md:text-sm text-blue-600 font-semibold group-hover:underline flex items-center gap-1 justify-center">
                                {displayVal} <PenLine className="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </span>
                            )}
                            <select
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              value={Array.isArray(val) ? (val[0] || '') : (val || '')}
                              onChange={(e) => {
                                if (onUpdateTask) onUpdateTask(row.id, col.key, e.target.value);
                              }}
                            >
                              <option value="" disabled>เลือก...</option>
                              {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </div>
                        </td>
                      );
                    }

                    const isReadonly = ['dateTime', 'equipTeams', 'fiberTeams'].includes(col.key);
                    if (isReadonly) {
                      return (
                        <td key={cIdx} className={tdClass} style={tdStyle} title={String(displayVal)}>
                          <div className={`truncate w-full text-xs md:text-sm text-slate-600 ${col.key === 'dateTime' ? 'cursor-not-allowed' : ''}`}>{displayVal}</div>
                        </td>
                      )
                    }

                    const cellId = `${row.id}-${col.key}`;
                    const isEditing = editingCell === cellId;

                    let inputType = "text";
                    let editValue = displayVal === '-' ? '' : String(displayVal);
                    let updateKey = col.key;

                    if (col.key === 'installDate' || col.key === 'date') {
                      inputType = "date";
                      editValue = row[col.key] || '';
                    } else if (col.key === 'timeRange') {
                      inputType = "time";
                      editValue = row.startTime || '';
                      updateKey = 'startTime';
                    }

                    return (
                      <td key={cIdx} className={tdClass} style={tdStyle} title={isEditing ? '' : String(displayVal)}>
                        {isEditing ? (
                          <input
                            type={inputType}
                            defaultValue={editValue}
                            className="w-full px-2 py-1 text-xs border border-blue-500 rounded outline-none shadow-inner"
                            autoFocus
                            onBlur={(e) => {
                              if (onUpdateTask && e.target.value !== editValue) {
                                onUpdateTask(row.id, updateKey, e.target.value);
                              }
                              setEditingCell(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (onUpdateTask && e.target.value !== String(editValue)) {
                                  onUpdateTask(row.id, updateKey, e.target.value);
                                }
                                setEditingCell(null);
                              }
                            }}
                          />
                        ) : (
                          <div
                            className="truncate w-full text-xs md:text-sm text-slate-700 cursor-text hover:bg-white hover:ring-1 hover:ring-blue-300 p-1 rounded transition-all group flex items-center"
                            onDoubleClick={() => setEditingCell(cellId)}
                            title={col.key === 'timeRange' ? "ดับเบิ้ลคลิกเพื่อแก้ไขเวลาเริ่ม" : ""}
                          >
                            <span className="truncate">{displayVal}</span>
                            <PenLine className="w-2 h-2 text-blue-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 border-t border-slate-200 p-2 flex items-center justify-between shrink-0 z-[60]">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Summary</span>
             <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">
                  {processedData.length === data.length 
                    ? `Total: ${data.length}` 
                    : `Filtered: ${processedData.length} of ${data.length}`}
                </span>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {displayLimit < processedData.length ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 shadow-sm animate-pulse">
               <ChevronDown className="w-3.5 h-3.5 font-bold" />
               <span className="text-[10px] font-bold">
                 Showing {Math.min(displayLimit, processedData.length)} of {processedData.length} items (Scroll down to load more)
               </span>
            </div>
          ) : (
            <div className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg border border-slate-200">
               <span className="text-[10px] font-bold">Showing {processedData.length} of {processedData.length} items</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
