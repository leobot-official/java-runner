import { Exercise, FacultyRecord, StudentRecord, Submission, Violation } from '../types';

// Clean initial data for fresh testing and production use
export const INITIAL_EXERCISES: Exercise[] = [];

export const INITIAL_STUDENTS: StudentRecord[] = [];

export const INITIAL_FACULTY: FacultyRecord[] = [
  { 
    email: 'sathish89visit@gmail.com', 
    name: 'Prof. Sathish', 
    department: 'Computer Science & Engineering' 
  },
];

export const INITIAL_SUBMISSIONS: Submission[] = [];

export const INITIAL_VIOLATIONS: Violation[] = [];
