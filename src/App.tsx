import React, { useState, useEffect } from 'react';
import { 
  Home, UserCog, MapPin, Network, CalendarDays, 
  Database, Menu, Layers, ExternalLink, Cloud, 
  PanelLeftClose, PanelLeftOpen, Package, ClipboardList,
  CircleAlert, CircleHelp
} from 'lucide-react';
import { onSnapshot, collection, doc, setDoc } from 'firebase/firestore';
import { db, initAuth, auth, handleFirestoreError, OperationType } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';
import { MasterData, TaskSys1, TaskSys2, TaskSys3 } from './types';
import { cn, getScopeDuration } from './lib/utils';

// Components
import { MainDashboardView } from './components/MainDashboardView';
import { DashboardView } from './components/DashboardView';
import { CalendarView } from './components/CalendarView';
import { DataTable } from './components/DataTable';
import { MasterDataView } from './components/MasterDataView';
import { FormModal } from './components/FormModal';
import { AssignSys1Form } from './components/AssignSys1Form';
import { AssignSys2Form, AssignSys3Form } from './components/Forms';

const defaultMasterData: MasterData = {
  equipTeams: ["Team A", "Team B", "Team C", "Team D"],
  fiberTeams: ["Fiber X", "Fiber Y", "Fiber Z"],
  configTeams: ["Config 1", "Config 2"],
  pmTeams: ["PM John", "PM Jane", "PM Peter"],
  scopeOfWorks: [
    "Install New", "Remove", "Migration", "Preventive Maintenance", "กำหนดเวลาเอง (Custom)", "อื่นๆ (Other)"
  ],
  statuses: [
    { name: "รอรับงาน", bg: "#f59e0b", text: "#b45309" },
    { name: "กำลังดำเนินการ", bg: "#3b82f6", text: "#1e3a8a" },
    { name: "สำเร็จ", bg: "#10b981", text: "#065f46" },
    { name: "ยกเลิก", bg: "#ef4444", text: "#991b1b" }
  ]
};

const sys1Columns = [
  { label: 'Install Date', key: 'installDate' },
  { label: 'Time (Start-End)', key: 'timeRange' },
  { label: 'Region Responsible', key: 'equipTeams' },
  { label: 'Fiber Responsible', key: 'fiberTeams' },
  { label: 'Config Responsible', key: 'configTeam' },
  { label: 'CIDs', key: 'cid' },
  { label: 'Customer Name', key: 'customerName' },
  { label: 'Scope of Work', key: 'scopeOfWork' },
  { label: 'Remark', key: 'remark' },
  { label: 'Address', key: 'location' },
  { label: 'PM Responsible', key: 'pmTeam' },
  { label: 'Status', key: 'status' },
  { label: 'Last Update', key: 'dateTime' }
];

const sys2Columns = [
  { label: 'Date', key: 'date' },
  { label: 'Survey ID', key: 'surveyId' },
  { label: 'Location', key: 'location' },
  { label: 'Surveyor', key: 'surveyor' },
  { label: 'Status', key: 'status' }
];

const sys3Columns = [
  { label: 'Order Date', key: 'date' },
  { label: 'CID', key: 'cid' },
  { label: 'From Port', key: 'fromPort' },
  { label: 'To Port', key: 'toPort' },
  { label: 'Status', key: 'status' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('main_dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [openModalForm, setOpenModalForm] = useState<string | null>(null);

  const [masterData, setMasterData] = useState<MasterData>(defaultMasterData);
  const [tasksSys1, setTasksSys1] = useState<TaskSys1[]>([]);
  const [tasksSys2, setTasksSys2] = useState<TaskSys2[]>([]);
  const [tasksSys3, setTasksSys3] = useState<TaskSys3[]>([]);

  const [user, setUser] = useState<User | null>(null);
  const [isDbReady, setIsDbReady] = useState(false);
  
  const appId = firebaseConfig.firestoreDatabaseId.replace('ai-studio-', '');

  useEffect(() => {
    initAuth().catch(console.error);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsDbReady(true);
        // Test connection
        import('firebase/firestore').then(({ doc, getDocFromServer }) => {
          getDocFromServer(doc(db, 'artifacts', appId, 'public', 'connection'))
            .catch(error => {
               if(error instanceof Error && error.message.includes('the client is offline')) {
                  console.error("Please check your Firebase configuration or network.");
               }
            });
        });
      }
    });
    return () => unsubscribe();
  }, [appId]);

  useEffect(() => {
    if (!isDbReady || !user) return;

    const masterDataDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'masterData');
    const unsubMaster = onSnapshot(masterDataDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          let data = docSnap.data() as MasterData;
          if (!data.scopeOfWorks) data.scopeOfWorks = defaultMasterData.scopeOfWorks;
          setMasterData(data);
        } else {
          setDoc(masterDataDocRef, defaultMasterData).catch(err => handleFirestoreError(err, OperationType.WRITE, masterDataDocRef.path));
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, masterDataDocRef.path)
    );

    const syncCollection = (colName: string, setStateFunc: (data: any[]) => void) => {
      const colPath = `artifacts/${appId}/public/data/${colName}`;
      return onSnapshot(collection(db, colPath),
        (snap) => {
          const items: any[] = [];
          snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
          items.sort((a, b) => b.id.localeCompare(a.id));
          setStateFunc(items);
        },
        (error) => handleFirestoreError(error, OperationType.GET, colPath)
      );
    };

    const unsubSys1 = syncCollection('tasksSys1', setTasksSys1);
    const unsubSys2 = syncCollection('tasksSys2', setTasksSys2);
    const unsubSys3 = syncCollection('tasksSys3', setTasksSys3);

    return () => {
      unsubMaster(); unsubSys1(); unsubSys2(); unsubSys3();
    };
  }, [isDbReady, user, appId]);

  const handleUpdateTaskInCloud = async (colName: string, taskId: string, key: string, val: any) => {
    if (!isDbReady) return;
    const taskDocRef = doc(db, 'artifacts', appId, 'public', 'data', colName, taskId);
    
    let updatedData: any = { [key]: val };
    updatedData.dateTime = new Date().toLocaleString('th-TH', { hour12: false });

    // Specific logic for Sys1 Time calculation
    if (colName === 'tasksSys1' && (key === 'scopeOfWork' || key === 'startTime')) {
      const currentTask = tasksSys1.find(t => t.id === taskId);
      if (currentTask) {
        const tempTask = { ...currentTask, [key]: val };
        const isCustom = (tempTask.scopeOfWork || '').includes('กำหนดเวลาเอง') || (tempTask.scopeOfWork || '').includes('Custom') || (tempTask.scopeOfWork || '') === 'อื่นๆ (Other)';
        if (!isCustom && tempTask.startTime) {
          const duration = getScopeDuration(tempTask.scopeOfWork);
          const [h, m] = tempTask.startTime.split(':').map(Number);
          const date = new Date();
          date.setHours(h, m + duration);
          updatedData.endTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        }
      }
    }

    try {
      await setDoc(taskDocRef, updatedData, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, taskDocRef.path);
    }
  };

  const [modalState, setModalState] = useState<{ isOpen: boolean, msg: string, type: 'alert' | 'confirm', onConfirm: (() => void) | null }>({ isOpen: false, msg: '', type: 'alert', onConfirm: null });
  
  // Expose global alert/confirm like original code
  useEffect(() => {
    (window as any).customAlert = (msg: string) => setModalState({ isOpen: true, msg, type: 'alert', onConfirm: null });
    (window as any).customConfirm = (msg: string, onConfirm: () => void) => setModalState({ isOpen: true, msg, type: 'confirm', onConfirm });
  }, []);

  const SidebarItem = ({ id, icon: Icon, label, subItems = [] }: any) => {
    const isActive = activeTab === id || subItems.some((s: any) => s.id === activeTab);
    const [isExpanded, setIsExpanded] = useState(isActive);

    useEffect(() => {
      if (subItems.some((s: any) => s.id === activeTab)) setIsExpanded(true);
    }, [activeTab, subItems]);

    const handleParentClick = () => {
      if (subItems.length > 0) {
        setIsExpanded(!isExpanded);
        if (!isExpanded && !subItems.some((s: any) => s.id === activeTab)) {
          setActiveTab(subItems[0].id);
        }
      } else {
        setActiveTab(id);
        if (window.innerWidth <= 1024) setIsSidebarOpen(false);
      }
    };

    const showLabel = !isSidebarCollapsed || window.innerWidth <= 1024;

    return (
      <div className="space-y-1">
        <button
          onClick={handleParentClick}
          title={isSidebarCollapsed ? label : ""}
          className={cn(
            "w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200",
            isActive ? "bg-blue-50 text-blue-700 font-bold shadow-sm border border-blue-100" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium",
            isSidebarCollapsed && "lg:justify-center lg:px-0"
          )}
        >
          <Icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "opacity-70", !isSidebarCollapsed ? "mr-3" : "lg:mr-0")} />
          {showLabel && <span className="whitespace-nowrap flex-1 text-left">{label}</span>}
          {showLabel && subItems.length > 0 && <Layers className={cn("w-3 h-3 transition-transform", isExpanded ? "rotate-180" : "")} />}
        </button>
        {isExpanded && subItems.length > 0 && showLabel && (
          <div className="pl-14 pr-4 space-y-1 pb-2 pt-1">
            {subItems.map((sub: any) => (
              <button
                key={sub.id}
                onClick={() => { setActiveTab(sub.id); if (window.innerWidth <= 1024) setIsSidebarOpen(false); }}
                className={cn(
                  "w-full flex items-center text-left px-3 py-2 text-sm rounded-lg transition-colors",
                  activeTab === sub.id ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                <div className={cn("w-1.5 h-1.5 rounded-full mr-2", activeTab === sub.id ? "bg-blue-600" : "bg-slate-300")}></div>
                {sub.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 flex w-full bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && window.innerWidth <= 1024 && (
        <div className="fixed inset-0 bg-slate-900/40 z-[45] backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white text-slate-800 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-50 shrink-0 transition-all duration-300 absolute lg:relative h-full border-r border-slate-200",
          isSidebarOpen 
            ? (isSidebarCollapsed ? "w-20 translate-x-0" : "w-72 translate-x-0") 
            : "w-0 -translate-x-full lg:translate-x-0 overflow-hidden"
        )}
      >
        <div className={cn("p-6 h-auto min-h-[80px] flex items-center border-b border-slate-100 shrink-0", isSidebarCollapsed && "lg:justify-center lg:px-2")}>
          <h1 className="text-lg font-bold flex items-center gap-3 w-full overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm"><Layers className="w-6 h-6" /></div>
            {(!isSidebarCollapsed || window.innerWidth <= 1024) && (
              <div className="flex flex-col min-w-0 transition-opacity duration-300">
                <span className="truncate tracking-wide text-blue-700">MASS</span>
                <span className="text-[9px] text-slate-500 font-normal truncate" title="Management And Service System">MASS System</span>
              </div>
            )}
          </h1>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
          <SidebarItem id="main_dashboard" icon={Home} label="Main Dashboard" />
          <div className="my-3 border-t border-slate-100"></div>
          <SidebarItem id="sys1_root" icon={UserCog} label="Region Assignment" subItems={[{ id: 'dashboard_sys1', label: 'Dashboard' }, { id: 'calendar_sys1', label: 'Calendar' }, { id: 'table_sys1', label: 'Region Tasks' }]} />
          <SidebarItem id="sys2_root" icon={MapPin} label="Pre Survey" subItems={[{ id: 'dashboard_sys2', label: 'Dashboard' }, { id: 'calendar_sys2', label: 'Calendar' }, { id: 'table_sys2', label: 'Pre Survey Tasks' }]} />
          <SidebarItem id="sys3_root" icon={Network} label="Cross Connect Order" subItems={[{ id: 'dashboard_sys3', label: 'Dashboard' }, { id: 'calendar_sys3', label: 'Calendar' }, { id: 'table_sys3', label: 'Cross Connect Tasks' }]} />
          <div className="my-3 border-t border-slate-100"></div>
          <SidebarItem id="combined_calendar" icon={CalendarDays} label="Calendar All System" />

          <div className="mt-6 pt-4 border-t border-slate-100">
            {(!isSidebarCollapsed || window.innerWidth <= 1024) && (
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">External Systems</p>
            )}
            <a
              href="#"
              title={isSidebarCollapsed ? "Remove Equipment" : ""}
              onClick={(e) => { e.preventDefault(); window.open('https://example.com', '_blank'); }}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-100 transition-colors shadow-sm group",
                isSidebarCollapsed && "lg:justify-center lg:px-0"
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform shrink-0">
                <Package className="w-4 h-4" />
              </div>
              {(!isSidebarCollapsed || window.innerWidth <= 1024) && (
                <>
                  <span className="flex-1 text-sm truncate">Remove Equip</span>
                  <ExternalLink className="w-3 h-3 opacity-50 shrink-0" />
                </>
              )}
            </a>
          </div>
        </nav>
        <div className="p-4 border-t border-slate-200 bg-white shrink-0">
          <button
            onClick={() => { setActiveTab('master_data'); if (window.innerWidth <= 1024) setIsSidebarOpen(false); }}
            title={isSidebarCollapsed ? "Master Data" : ""}
            className={cn(
              "w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-colors",
              activeTab === 'master_data' ? "bg-blue-50 text-blue-700 font-bold shadow-sm border border-blue-100" : "text-slate-600 hover:bg-slate-50 font-medium",
              isSidebarCollapsed && "lg:justify-center lg:px-0"
            )}
          >
            <Database className={cn("w-5 h-5 text-blue-600", !isSidebarCollapsed ? "mr-2" : "lg:mr-0")} /> 
            {(!isSidebarCollapsed || window.innerWidth <= 1024) && <span>Master Data</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative w-full h-full overflow-hidden bg-slate-50 flex flex-col">
        <header className="p-4 md:px-6 md:py-4 bg-white border-b border-slate-200 shrink-0 flex items-center gap-3 shadow-sm z-10">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 lg:hidden">
            <Menu className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
            className="p-2 bg-slate-50 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 hidden lg:flex transition-colors border border-slate-200"
            title={isSidebarCollapsed ? "ขยายแถบเมนู" : "หุบแถบเมนู"}
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex-1">
            {activeTab === 'main_dashboard' && 'Main Dashboard'}
            {activeTab === 'dashboard_sys1' && 'Region Assignment Dashboard'}
            {activeTab === 'dashboard_sys2' && 'Pre Survey Dashboard'}
            {activeTab === 'dashboard_sys3' && 'Cross Connect Order Dashboard'}
            {activeTab === 'calendar_sys1' && 'Region Assignment Calendar'}
            {activeTab === 'calendar_sys2' && 'Pre Survey Calendar'}
            {activeTab === 'calendar_sys3' && 'Cross Connect Calendar'}
            {activeTab === 'combined_calendar' && 'Calendar All System'}
            {activeTab === 'table_sys1' && 'Region Assignment Tasks'}
            {activeTab === 'table_sys2' && 'Pre Survey Tasks'}
            {activeTab === 'table_sys3' && 'Cross Connect Tasks'}
            {activeTab === 'master_data' && 'Master Data'}
          </h2>
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            {isDbReady ? (
              <><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> <span className="text-[10px] font-bold text-slate-600">Cloud Synced</span></>
            ) : (
              <><div className="w-2 h-2 rounded-full bg-orange-500"></div> <span className="text-[10px] font-bold text-slate-600">Connecting...</span></>
            )}
          </div>
        </header>

        <div className="flex-1 p-3 md:p-6 overflow-y-auto custom-scrollbar flex flex-col min-h-0 relative">
          {activeTab === 'main_dashboard' && <MainDashboardView tasksSys1={tasksSys1} tasksSys2={tasksSys2} tasksSys3={tasksSys3} masterData={masterData} />}
          {activeTab === 'dashboard_sys1' && <DashboardView systemMode="sys1" tasksSys1={tasksSys1} masterData={masterData} />}
          {activeTab === 'dashboard_sys2' && <DashboardView systemMode="sys2" tasksSys1={tasksSys2} masterData={masterData} />}
          {activeTab === 'dashboard_sys3' && <DashboardView systemMode="sys3" tasksSys1={tasksSys3} masterData={masterData} />}

          {activeTab === 'calendar_sys1' && <CalendarView systemMode="sys1" tasksSys1={tasksSys1} tasksSys2={tasksSys2} tasksSys3={tasksSys3} masterData={masterData} />}
          {activeTab === 'calendar_sys2' && <CalendarView systemMode="sys2" tasksSys1={tasksSys1} tasksSys2={tasksSys2} tasksSys3={tasksSys3} masterData={masterData} />}
          {activeTab === 'calendar_sys3' && <CalendarView systemMode="sys3" tasksSys1={tasksSys1} tasksSys2={tasksSys2} tasksSys3={tasksSys3} masterData={masterData} />}
          {activeTab === 'combined_calendar' && <CalendarView systemMode="all" tasksSys1={tasksSys1} tasksSys2={tasksSys2} tasksSys3={tasksSys3} masterData={masterData} />}

          {activeTab === 'table_sys1' && <DataTable title="Region Assignment Tasks" columns={sys1Columns} data={tasksSys1} masterData={masterData} onAddClick={() => setOpenModalForm('sys1')} addLabel="Assign Task" btnClass="bg-blue-600 hover:bg-blue-700" onUpdateTask={(id, k, v) => handleUpdateTaskInCloud('tasksSys1', id, k, v)} />}
          {activeTab === 'table_sys2' && <DataTable title="Pre Survey Tasks" columns={sys2Columns} data={tasksSys2} masterData={masterData} onAddClick={() => setOpenModalForm('sys2')} addLabel="Add Survey" btnClass="bg-amber-600 hover:bg-amber-700" onUpdateTask={(id, k, v) => handleUpdateTaskInCloud('tasksSys2', id, k, v)} />}
          {activeTab === 'table_sys3' && <DataTable title="Cross Connect Tasks" columns={sys3Columns} data={tasksSys3} masterData={masterData} onAddClick={() => setOpenModalForm('sys3')} addLabel="Add Order" btnClass="bg-emerald-600 hover:bg-emerald-700" onUpdateTask={(id, k, v) => handleUpdateTaskInCloud('tasksSys3', id, k, v)} />}

          {activeTab === 'master_data' && <MasterDataView masterData={masterData} appId={appId} />}

          {/* Form Modals */}
          <FormModal isOpen={openModalForm === 'sys1'} onClose={() => setOpenModalForm(null)} title="ฟอร์มมอบหมายงาน Region" icon={<ClipboardList className="w-6 h-6 text-blue-600" />} colorTheme="blue">
            <AssignSys1Form isModal tasksSys1={tasksSys1} masterData={masterData} onClose={() => setOpenModalForm(null)} appId={appId} />
          </FormModal>
          <FormModal isOpen={openModalForm === 'sys2'} onClose={() => setOpenModalForm(null)} title="ฟอร์มบันทึกงานสำรวจ" icon={<MapPin className="w-6 h-6 text-amber-600" />} colorTheme="amber">
            <AssignSys2Form isModal masterData={masterData} onClose={() => setOpenModalForm(null)} appId={appId} />
          </FormModal>
          <FormModal isOpen={openModalForm === 'sys3'} onClose={() => setOpenModalForm(null)} title="เปิดออเดอร์ Cross Connect" icon={<Network className="w-6 h-6 text-emerald-600" />} colorTheme="emerald">
            <AssignSys3Form isModal masterData={masterData} onClose={() => setOpenModalForm(null)} appId={appId} />
          </FormModal>
        </div>
      </main>

      {/* Global Alert/Confirm Modal */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
            {modalState.type === 'alert' ? <CircleAlert className="w-12 h-12 text-blue-500 mx-auto mb-4" /> : <CircleHelp className="w-12 h-12 text-amber-500 mx-auto mb-4" />}
            <p className="text-slate-800 text-sm md:text-base font-semibold mb-6 whitespace-pre-wrap">{modalState.msg}</p>
            <div className="flex justify-center gap-3">
              {modalState.type === 'confirm' && <button onClick={() => setModalState({ ...modalState, isOpen: false })} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-colors">ยกเลิก</button>}
              <button
                onClick={() => { if (modalState.type === 'confirm' && modalState.onConfirm) modalState.onConfirm(); setModalState({ ...modalState, isOpen: false }); }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors"
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
