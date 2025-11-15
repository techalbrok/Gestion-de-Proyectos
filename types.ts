export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum ProjectStage {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  REVIEW = 'review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum Priority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum NotificationType {
    MENTION = 'mention',
    ASSIGNMENT = 'assignment',
    STAGE_CHANGE = 'stage_change',
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
}

export interface Department {
  id:string;
  name: string;
  description?: string;
  coordinator_id?: string;
}

export interface UserDepartment {
    user_id: string;
    department_id: string;
}

export interface Comment {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  is_completed: boolean;
  assigned_to?: string;
  due_date?: string | null;
  created_by: string;
  created_at: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  department_id: string;
  stage: ProjectStage;
  priority: Priority;
  start_date: string;
  due_date: string | null;
  created_by: string;
  members: string[]; // array of user ids
  history: ProjectHistory[];
  comments_count: number;
  tasks_count: number;
}

export interface ProjectHistory {
  id: string;
  project_id: string;
  changed_by: string;
  previous_stage: ProjectStage | null;
  new_stage: ProjectStage;
  timestamp: string;
}

export interface RecentHistoryEntry extends ProjectHistory {
  projects: { title: string } | null;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error';
}

export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
}

export interface Notification {
  id: string;
  user_id: string; // recipient
  actor_id: string;
  project_id: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
  comment_preview?: string; // Also used for stage name in stage_change
  // Joined data from API
  actor: User;
  project: { title: string };
}

export interface ProjectAttachment {
  id: string;
  project_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
}