// Status Types
export type ProjectStatus = 'planejamento' | 'em_andamento' | 'pausado' | 'concluido' | 'cancelado';
export type TaskStatus = 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
export type EmployeeStatus = 'ativo' | 'inativo' | 'ferias' | 'afastado';
export type BudgetStatus = 'pendente' | 'aprovado' | 'rejeitado' | 'em_analise';
export type RequestStatus = 'pendente' | 'aprovado' | 'rejeitado' | 'entregue';
export type DeliveryStatus = 'pendente' | 'em_transito' | 'entregue' | 'cancelado';

// Priority Types
export type Priority = 'baixa' | 'media' | 'alta' | 'urgente';

// Specialty Types
export type Specialty = 
  | 'engenheiro'
  | 'arquiteto'
  | 'mestre_obras'
  | 'pedreiro'
  | 'eletricista'
  | 'encanador'
  | 'pintor'
  | 'carpinteiro'
  | 'servente'
  | 'outro';

// Material Category Types
export type MaterialCategory =
  | 'cimento'
  | 'areia'
  | 'pedra'
  | 'tijolo'
  | 'ferro'
  | 'madeira'
  | 'tinta'
  | 'eletrico'
  | 'hidraulico'
  | 'acabamento'
  | 'outro';

// Unit Types
export type Unit = 'un' | 'kg' | 'm' | 'm²' | 'm³' | 'l' | 'saco' | 'barra' | 'milheiro' | 'caixa';

// ==================== MAIN ENTITIES ====================

// Project Entity
export interface Project {
  id: string;
  code: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  location: string;
  client: string;
  budget: number;
  spent: number;
  progress: number;
  priority: Priority;
  teamSize: number;
  manager: string;
  createdAt: string;
  updatedAt: string;
}

// Employee Entity
export interface Employee {
  id: string;
  name: string;
  role: string;
  specialty: Specialty;
  phone: string;
  email: string;
  projectId?: string;
  status: EmployeeStatus;
  hireDate: string;
  salary: number;
  createdAt: string;
  updatedAt: string;
}

// Material Entity
export interface Material {
  id: string;
  name: string;
  category: MaterialCategory;
  unit: Unit;
  quantity: number;
  minQuantity: number;
  price: number;
  supplier: string;
  location: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

// Task Entity
export interface Task {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: TaskStatus;
  progress: number;
  startDate: string;
  endDate: string;
  assignedTo: string;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
}

// Daily Log Entity
export interface DailyLog {
  id: string;
  projectId: string;
  date: string;
  weather: string;
  temperature: number;
  workersPresent: number;
  workersAbsent: number;
  activities: string;
  materials: string;
  incidents: string;
  observations: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Budget Entity
export interface Budget {
  id: string;
  projectId: string;
  category: string;
  description: string;
  planned: number;
  spent: number;
  status: BudgetStatus;
  createdAt: string;
  updatedAt: string;
}

// Material Request Entity
export interface MaterialRequest {
  id: string;
  projectId: string;
  materialId: string;
  quantity: number;
  requestedBy: string;
  requestDate: string;
  neededDate: string;
  status: RequestStatus;
  priority: Priority;
  justification: string;
  createdAt: string;
  updatedAt: string;
}

// Delivery Entity
export interface Delivery {
  id: string;
  projectId: string;
  materialId: string;
  requestId?: string;
  quantity: number;
  deliveryDate: string;
  receivedBy: string;
  status: DeliveryStatus;
  notes: string;
  supplier: string;
  invoice?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== FORM TYPES ====================

export interface ProjectFormData {
  code: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  location: string;
  client: string;
  budget: number;
  priority: Priority;
  manager: string;
}

export interface EmployeeFormData {
  name: string;
  role: string;
  specialty: Specialty;
  phone: string;
  email: string;
  projectId?: string;
  hireDate: string;
  salary: number;
}

export interface MaterialFormData {
  name: string;
  category: MaterialCategory;
  unit: Unit;
  quantity: number;
  minQuantity: number;
  price: number;
  supplier: string;
  location: string;
  projectId?: string;
}

export interface TaskFormData {
  projectId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  assignedTo: string;
  priority: Priority;
}

export interface DailyLogFormData {
  projectId: string;
  date: string;
  weather: string;
  temperature: number;
  workersPresent: number;
  workersAbsent: number;
  activities: string;
  materials: string;
  incidents: string;
  observations: string;
}

export interface MaterialRequestFormData {
  projectId: string;
  materialId: string;
  quantity: number;
  neededDate: string;
  priority: Priority;
  justification: string;
}

// ==================== FILTER TYPES ====================

export interface ProjectFilter {
  status?: ProjectStatus[];
  priority?: Priority[];
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface EmployeeFilter {
  specialty?: Specialty[];
  status?: EmployeeStatus[];
  projectId?: string;
  search?: string;
}

export interface MaterialFilter {
  category?: MaterialCategory[];
  lowStock?: boolean;
  projectId?: string;
  search?: string;
}

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: Priority[];
  projectId?: string;
  assignedTo?: string;
  search?: string;
}

// ==================== STATISTICS TYPES ====================

export interface ProjectStats {
  total: number;
  planejamento: number;
  emAndamento: number;
  pausado: number;
  concluido: number;
  cancelado: number;
  totalBudget: number;
  totalSpent: number;
  averageProgress: number;
}

export interface EmployeeStats {
  total: number;
  ativo: number;
  inativo: number;
  ferias: number;
  afastado: number;
  bySpecialty: Record<Specialty, number>;
}

export interface MaterialStats {
  total: number;
  lowStock: number;
  totalValue: number;
  byCategory: Record<MaterialCategory, number>;
}

export interface BudgetStats {
  totalPlanned: number;
  totalSpent: number;
  variance: number;
  byCategory: Record<string, { planned: number; spent: number }>;
}

// ==================== CHART DATA TYPES ====================

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

export interface TimelineData {
  date: string;
  value: number;
  label?: string;
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ==================== USER TYPES ====================

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'engineer' | 'supervisor' | 'worker';
  avatar?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  user: User;
  token: string;
  expiresAt: string;
}

// ==================== NOTIFICATION TYPES ====================

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}
