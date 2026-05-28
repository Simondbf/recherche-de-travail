/**
 * Types declarations for the Job Search Tracker Application
 */

export type ApplicationStatus = 'to_apply' | 'applied' | 'interviewing' | 'offer' | 'rejected';

export interface JobContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface JobApplication {
  id: string;
  userId: string;
  userDisplayName?: string;
  title: string;
  company: string;
  status: ApplicationStatus;
  dateApplied?: string; // YYYY-MM-DD
  location?: string;
  url?: string;
  salary?: string;
  contacts?: JobContact[];
  notes?: string;
  timeline?: TimelineEvent[];
  createdAt: string; // ISO String or serialized Timestamp
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'status_change' | 'note' | 'interview' | 'offer' | 'followup';
  title: string;
  description?: string;
}

export interface UserStats {
  userId: string;
  displayName: string;
  photoURL?: string;
  totalApplied: number;
  totalInterviewing: number;
  totalOffers: number;
  lastActive: string;
}
