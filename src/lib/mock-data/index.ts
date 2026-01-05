import type { 
  Project, 
  Employee, 
  Material, 
  Task, 
  DailyLog, 
  Budget,
  MaterialRequest,
  Delivery 
} from '../types';

// Projetos Mock
export const mockProjects: Project[] = [
  {
    id: '1',
    code: 'OBR-2024-001',
    name: 'Edifício Vila Madalena',
    description: 'Construção de edifício residencial com 15 andares',
    status: 'em_andamento',
    startDate: '2024-01-15T00:00:00Z',
    endDate: '2025-04-15T00:00:00Z',
    location: 'Vila Madalena, São Paulo - SP',
    client: 'Construtora ABC Ltda',
    budget: 4500000,
    spent: 2925000,
    progress: 65,
    priority: 'alta',
    teamSize: 45,
    manager: 'Eng. Carlos Silva',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-12-28T00:00:00Z'
  },
  {
    id: '2',
    code: 'OBR-2024-002',
    name: 'Centro Comercial Brooklin',
    description: 'Shopping center com área de lazer e estacionamento',
    status: 'planejamento',
    startDate: '2024-03-10T00:00:00Z',
    endDate: '2025-08-20T00:00:00Z',
    location: 'Brooklin, São Paulo - SP',
    client: 'Shopping Centers SA',
    budget: 8200000,
    spent: 1230000,
    progress: 15,
    priority: 'media',
    teamSize: 12,
    manager: 'Eng. Maria Santos',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-12-28T00:00:00Z'
  },
  {
    id: '3',
    code: 'OBR-2023-045',
    name: 'Galpão Industrial Guarulhos',
    description: 'Galpão logístico com sistema automatizado',
    status: 'concluido',
    startDate: '2023-05-05T00:00:00Z',
    endDate: '2024-11-30T00:00:00Z',
    location: 'Guarulhos, São Paulo - SP',
    client: 'Logística Express Ltda',
    budget: 3200000,
    spent: 3150000,
    progress: 100,
    priority: 'baixa',
    teamSize: 28,
    manager: 'Eng. Roberto Lima',
    createdAt: '2023-04-15T00:00:00Z',
    updatedAt: '2024-11-30T00:00:00Z'
  },
  {
    id: '4',
    code: 'OBR-2024-003',
    name: 'Condomínio Alphaville',
    description: 'Condomínio residencial de alto padrão',
    status: 'pausado',
    startDate: '2024-02-20T00:00:00Z',
    endDate: '2025-06-10T00:00:00Z',
    location: 'Alphaville, Barueri - SP',
    client: 'Incorporadora Premium',
    budget: 6500000,
    spent: 1950000,
    progress: 30,
    priority: 'baixa',
    teamSize: 8,
    manager: 'Eng. Ana Costa',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-12-28T00:00:00Z'
  }
];

// Funcionários Mock
export const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Carlos Silva',
    role: 'Engenheiro Civil',
    specialty: 'engenheiro',
    phone: '(11) 98765-4321',
    email: 'carlos.silva@constructflow.com',
    projectId: '1',
    status: 'ativo',
    hireDate: '2020-03-15T00:00:00Z',
    salary: 12000,
    createdAt: '2020-03-10T00:00:00Z',
    updatedAt: '2024-12-28T00:00:00Z'
  },
  {
    id: '2',
    name: 'Maria Santos',
    role: 'Engenheira Civil',
    specialty: 'engenheiro',
    phone: '(11) 98765-4322',
    email: 'maria.santos@constructflow.com',
    projectId: '2',
    status: 'ativo',
    hireDate: '2019-06-20T00:00:00Z',
    salary: 13000,
    createdAt: '2019-06-15T00:00:00Z',
    updatedAt: '2024-12-28T00:00:00Z'
  },
  {
    id: '3',
    name: 'João Pereira',
    role: 'Pedreiro',
    specialty: 'pedreiro',
    phone: '(11) 98765-4323',
    email: 'joao.pereira@constructflow.com',
    projectId: '1',
    status: 'ativo',
    hireDate: '2021-01-10T00:00:00Z',
    salary: 4500,
    createdAt: '2021-01-05T00:00:00Z',
    updatedAt: '2024-12-28T00:00:00Z'
  },
  {
    id: '4',
    name: 'Ana Costa',
    role: 'Arquiteta',
    specialty: 'arquiteto',
    phone: '(11) 98765-4324',
    email: 'ana.costa@constructflow.com',
    projectId: '4',
    status: 'ativo',
    hireDate: '2020-08-15T00:00:00Z',
    salary: 10000,
    createdAt: '2020-08-10T00:00:00Z',
    updatedAt: '2024-12-28T00:00:00Z'
  },
  {
    id: '5',
    name: 'Roberto Lima',
    role: 'Engenheiro Civil',
    specialty: 'engenheiro',
    phone: '(11) 98765-4325',
    email: 'roberto.lima@constructflow.com',
    projectId: '3',
    status: 'ferias',
    hireDate: '2018-04-20T00:00:00Z',
    salary: 14000,
    createdAt: '2018-04-15T00:00:00Z',
    updatedAt: '2024-12-28T00:00:00Z'
  }
];

// Materiais Mock
export const mockMaterials: Material[] = [
  {
    id: '1',
    name: 'Cimento CP-II',
    category: 'cimento',
    unit: 'saco',
    quantity: 450,
    minQuantity: 200,
    price: 35.50,
    supplier: 'Cimentos Brasil SA',
    location: 'Depósito Central',
    projectId: '1',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-12-28T00:00:00Z'
  },
  {
    id: '2',
    name: 'Areia Média',
    category: 'areia',
    unit: 'm³',
    quantity: 85,
    minQuantity: 50,
    price: 120.00,
    supplier: 'Areias São Paulo Ltda',
    location: 'Depósito Central',
    projectId: '1',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-12-28T00:00:00Z'
  },
  {
    id: '3',
    name: 'Tijolo Cerâmico 8 Furos',
    category: 'tijolo',
    unit: 'milheiro',
    quantity: 12,
    minQuantity: 10,
    price: 850.00,
    supplier: 'Cerâmica Paulista',
    location: 'Obra Vila Madalena',
    projectId: '1',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-12-28T00:00:00Z'
  },
  {
    id: '4',
    name: 'Vergalhão 10mm',
    category: 'ferro',
    unit: 'barra',
    quantity: 350,
    minQuantity: 200,
    price: 42.00,
    supplier: 'Aço Forte Ltda',
    location: 'Depósito Central',
    projectId: '2',
    createdAt: '2024-03-10T00:00:00Z',
    updatedAt: '2024-12-28T00:00:00Z'
  },
  {
    id: '5',
    name: 'Brita 1',
    category: 'pedra',
    unit: 'm³',
    quantity: 15,
    minQuantity: 30,
    price: 95.00,
    supplier: 'Pedreira Granite',
    location: 'Depósito Central',
    projectId: '1',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-12-28T00:00:00Z'
  }
];

// Tarefas Mock
export const mockTasks: Task[] = [
  {
    id: '1',
    projectId: '1',
    name: 'Fundação',
    description: 'Escavação e fundação do edifício',
    status: 'concluido',
    progress: 100,
    startDate: '2024-01-15T00:00:00Z',
    endDate: '2024-03-15T00:00:00Z',
    assignedTo: '1',
    priority: 'alta',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-03-15T00:00:00Z'
  },
  {
    id: '2',
    projectId: '1',
    name: 'Estrutura - Pilares e Vigas',
    description: 'Execução de pilares e vigas até o 8º andar',
    status: 'em_andamento',
    progress: 65,
    startDate: '2024-03-20T00:00:00Z',
    endDate: '2024-12-30T00:00:00Z',
    assignedTo: '1',
    priority: 'alta',
    createdAt: '2024-03-15T00:00:00Z',
    updatedAt: '2024-12-28T00:00:00Z'
  },
  {
    id: '3',
    projectId: '1',
    name: 'Alvenaria',
    description: 'Levantamento de paredes internas',
    status: 'pendente',
    progress: 0,
    startDate: '2025-01-10T00:00:00Z',
    endDate: '2025-03-10T00:00:00Z',
    assignedTo: '3',
    priority: 'media',
    createdAt: '2024-12-20T00:00:00Z',
    updatedAt: '2024-12-28T00:00:00Z'
  },
  {
    id: '4',
    projectId: '2',
    name: 'Projeto Arquitetônico',
    description: 'Desenvolvimento do projeto arquitetônico completo',
    status: 'em_andamento',
    progress: 80,
    startDate: '2024-02-01T00:00:00Z',
    endDate: '2024-12-31T00:00:00Z',
    assignedTo: '4',
    priority: 'alta',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-12-28T00:00:00Z'
  }
];

// Diários de Obra Mock
export const mockDailyLogs: DailyLog[] = [
  {
    id: '1',
    projectId: '1',
    date: '2024-12-27T00:00:00Z',
    weather: 'Ensolarado',
    temperature: 28,
    workersPresent: 42,
    workersAbsent: 3,
    activities: 'Concretagem da laje do 8º andar. Instalação de formas do 9º andar.',
    materials: 'Consumo: 15m³ de concreto, 200kg de aço.',
    incidents: 'Nenhum incidente reportado.',
    observations: 'Bom andamento dos trabalhos. Prazo mantido.',
    createdBy: '1',
    createdAt: '2024-12-27T18:00:00Z',
    updatedAt: '2024-12-27T18:00:00Z'
  },
  {
    id: '2',
    projectId: '1',
    date: '2024-12-28T00:00:00Z',
    weather: 'Nublado',
    temperature: 25,
    workersPresent: 45,
    workersAbsent: 0,
    activities: 'Finalização da concretagem. Início da alvenaria do 5º andar.',
    materials: 'Consumo: 8m³ de concreto, 5000 tijolos.',
    incidents: 'Pequeno atraso na entrega de tijolos (2 horas).',
    observations: 'Equipe completa. Produtividade alta.',
    createdBy: '1',
    createdAt: '2024-12-28T18:00:00Z',
    updatedAt: '2024-12-28T18:00:00Z'
  }
];

// Orçamentos Mock
export const mockBudgets: Budget[] = [
  {
    id: '1',
    projectId: '1',
    category: 'Materiais',
    description: 'Cimento, areia, tijolo, ferro',
    planned: 1800000,
    spent: 1170000,
    status: 'aprovado',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-12-28T00:00:00Z'
  },
  {
    id: '2',
    projectId: '1',
    category: 'Mão de Obra',
    description: 'Equipe de engenheiros, pedreiros, serventes',
    planned: 1500000,
    spent: 975000,
    status: 'aprovado',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-12-28T00:00:00Z'
  },
  {
    id: '3',
    projectId: '1',
    category: 'Equipamentos',
    description: 'Aluguel de guincho, betoneira, andaimes',
    planned: 800000,
    spent: 520000,
    status: 'aprovado',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-12-28T00:00:00Z'
  },
  {
    id: '4',
    projectId: '1',
    category: 'Serviços Terceirizados',
    description: 'Projeto estrutural, elétrico, hidráulico',
    planned: 400000,
    spent: 260000,
    status: 'em_analise',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-12-28T00:00:00Z'
  }
];

// Solicitações de Material Mock
export const mockMaterialRequests: MaterialRequest[] = [
  {
    id: '1',
    projectId: '1',
    materialId: '1',
    quantity: 100,
    requestedBy: '1',
    requestDate: '2024-12-20T00:00:00Z',
    neededDate: '2024-12-28T00:00:00Z',
    status: 'aprovado',
    priority: 'alta',
    justification: 'Continuidade da obra - concretagem próxima laje',
    createdAt: '2024-12-20T10:00:00Z',
    updatedAt: '2024-12-21T14:00:00Z'
  },
  {
    id: '2',
    projectId: '1',
    materialId: '5',
    quantity: 30,
    requestedBy: '1',
    requestDate: '2024-12-22T00:00:00Z',
    neededDate: '2024-12-30T00:00:00Z',
    status: 'pendente',
    priority: 'media',
    justification: 'Reposição de estoque - nível abaixo do mínimo',
    createdAt: '2024-12-22T09:00:00Z',
    updatedAt: '2024-12-22T09:00:00Z'
  },
  {
    id: '3',
    projectId: '2',
    materialId: '4',
    quantity: 200,
    requestedBy: '2',
    requestDate: '2024-12-15T00:00:00Z',
    neededDate: '2024-12-25T00:00:00Z',
    status: 'entregue',
    priority: 'alta',
    justification: 'Início da estrutura metálica',
    createdAt: '2024-12-15T11:00:00Z',
    updatedAt: '2024-12-24T16:00:00Z'
  }
];

// Entregas Mock
export const mockDeliveries: Delivery[] = [
  {
    id: '1',
    projectId: '1',
    materialId: '1',
    requestId: '1',
    quantity: 100,
    deliveryDate: '2024-12-27T00:00:00Z',
    receivedBy: '1',
    status: 'entregue',
    notes: 'Material em perfeito estado. Entrega dentro do prazo.',
    supplier: 'Cimentos Brasil SA',
    invoice: 'NF-45821',
    createdAt: '2024-12-27T08:00:00Z',
    updatedAt: '2024-12-27T09:30:00Z'
  },
  {
    id: '2',
    projectId: '1',
    materialId: '5',
    quantity: 25,
    deliveryDate: '2024-12-28T00:00:00Z',
    receivedBy: '3',
    status: 'em_transito',
    notes: 'Previsão de chegada: 14h',
    supplier: 'Pedreira Granite',
    createdAt: '2024-12-28T06:00:00Z',
    updatedAt: '2024-12-28T10:00:00Z'
  },
  {
    id: '3',
    projectId: '2',
    materialId: '4',
    requestId: '3',
    quantity: 200,
    deliveryDate: '2024-12-24T00:00:00Z',
    receivedBy: '2',
    status: 'entregue',
    notes: 'Entrega conforme solicitado.',
    supplier: 'Aço Forte Ltda',
    invoice: 'NF-78234',
    createdAt: '2024-12-24T10:00:00Z',
    updatedAt: '2024-12-24T16:00:00Z'
  }
];
