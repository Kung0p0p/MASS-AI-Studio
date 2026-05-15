export interface Status {
  name: string;
  bg: string;
  text: string;
}

export interface ScopeOfWork {
  name: string;
  duration: number; // in minutes
  isManual: boolean; // if true, user must enter time manually
}

export interface MasterData {
  equipTeams: string[];
  fiberTeams: string[];
  configTeams: string[];
  pmTeams: string[];
  scopeOfWorks: ScopeOfWork[];
  statuses: Status[];
}

export interface TaskSys1 {
  id: string;
  dateTime: string;
  installDate: string;
  startTime: string;
  endTime: string;
  helperEndTime: string;
  equipTeams: string[];
  equipTeamsSub: string[];
  fiberTeams: string[];
  configTeam: string;
  pmTeam: string;
  cid: string;
  customerName: string;
  scopeOfWork: string;
  otherScopeDetail: string;
  customerContact: string;
  location: string;
  status: string;
  remark: string;
  createdAt: string;
}

export interface TaskSys2 {
  id: string;
  date: string;
  surveyId: string;
  location: string;
  surveyor: string;
  status: string;
}

export interface TaskSys3 {
  id: string;
  date: string;
  cid: string;
  fromPort: string;
  toPort: string;
  status: string;
}
