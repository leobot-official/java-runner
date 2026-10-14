export type UserRole = 'FACULTY' | 'STUDENT' | 'GUEST';

export interface User {
  role: UserRole;
  email: string;
  name: string;
  regNo?: string;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  openTime: string; // ISO string or datetime-local
  closeTime: string; // ISO string or datetime-local
  publicInput: string;
  publicOutput: string;
  privateInput: string;
  privateOutput: string;
  starterCode?: string;
  maxScore?: number;
}

export type SubmissionStatus = 
  | 'ALL TEST CASES PASSED'
  | 'PARTIAL PASS'
  | 'FAILED'
  | 'COMPILATION ERROR'
  | 'TIME LIMIT EXCEEDED'
  | 'PENDING';

export interface Submission {
  id: string;
  timestamp: string;
  studentEmail: string;
  regNo: string;
  studentName?: string;
  exerciseId: string;
  exerciseTitle?: string;
  code: string;
  status: SubmissionStatus;
  publicLog: string;
  privateLog: string;
  publicPassed: boolean;
  privatePassed: boolean;
  score: number;
}

export type ViolationType = 
  | 'TAB_SWITCH' 
  | 'FULLSCREEN_EXIT' 
  | 'COPY' 
  | 'PASTE' 
  | 'DEVTOOLS_ATTEMPT' 
  | 'MULTIPLE_DEVICES';

export interface Violation {
  id: string;
  timestamp: string;
  studentEmail: string;
  regNo: string;
  studentName?: string;
  exerciseId: string;
  exerciseTitle?: string;
  type: ViolationType;
  details: string;
  severity: 'low' | 'medium' | 'high';
}

export interface StudentRecord {
  email: string;
  regNo: string;
  name: string;
  department: string;
  submissionsCount?: number;
  violationsCount?: number;
}

export interface FacultyRecord {
  email: string;
  name: string;
  department: string;
}

export interface ExecutionResult {
  passed: boolean;
  log: string;
  actualOutput?: string;
  expectedOutput?: string;
  executionTimeMs?: number;
  isError?: boolean;
  isTimeout?: boolean;
}

export interface SystemSettings {
  renderServiceUrl: string;
  apiSecret: string;
  googleSheetsUrl: string;
  enforceFullscreen: boolean;
  blockCopyPaste: boolean;
  trackTabSwitches: boolean;
  useBuiltinRunner: boolean;
}
