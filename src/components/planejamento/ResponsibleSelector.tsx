'use client';

import { useState, useEffect } from 'react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
}

interface ResponsibleSelectorProps {
  projectId: string;
  value?: string;
  valueName?: string;
  onChange: (id: string, name: string) => void;
}

export function ResponsibleSelector({ projectId, value, valueName, onChange }: ResponsibleSelectorProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    async function load() {
      try {
        // Buscar colaboradores alocados ao projeto
        let res = await fetch(`/api/team?costCenterId=${projectId}&costCenterType=project`);
        let data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
          // Fallback: buscar todos
          res = await fetch('/api/team');
          data = await res.json();
        }

        if (Array.isArray(data)) {
          setMembers(data);
        }
      } catch {
        // silenciar erro
      }
    }
    if (projectId) load();
  }, [projectId]);

  const roleLabels: Record<string, string> = {
    ENGENHEIRO: 'Engenheiro',
    ARQUITETO: 'Arquiteto',
    MESTRE_DE_OBRAS: 'Mestre de Obras',
    PEDREIRO: 'Pedreiro',
    ELETRICISTA: 'Eletricista',
    ENCANADOR: 'Encanador',
    CARPINTEIRO: 'Carpinteiro',
    PINTOR: 'Pintor',
    SERVENTE: 'Servente',
    ADMINISTRATIVO: 'Administrativo',
    OUTRO: 'Outro',
  };

  return (
    <select
      value={value || ''}
      onChange={(e) => {
        const member = members.find((m) => m.id === e.target.value);
        if (member) {
          onChange(member.id, member.name);
        } else if (e.target.value === '') {
          onChange('', '');
        }
      }}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="">{valueName || 'Selecionar responsavel...'}</option>
      {members.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name} — {roleLabels[m.role] || m.role}
        </option>
      ))}
    </select>
  );
}
