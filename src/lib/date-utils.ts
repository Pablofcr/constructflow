// ====================================================================
// DATE UTILITIES - Funções auxiliares para Gantt Chart e Planejamento
// ====================================================================

export function differenceInDays(dateA: Date, dateB: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const utcA = Date.UTC(dateA.getFullYear(), dateA.getMonth(), dateA.getDate());
  const utcB = Date.UTC(dateB.getFullYear(), dateB.getMonth(), dateB.getDate());
  return Math.floor((utcA - utcB) / msPerDay);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function formatMonthYear(date: Date): string {
  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function eachMonthOfInterval(start: Date, end: Date): Date[] {
  const months: Date[] = [];
  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (current <= endMonth) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }
  return months;
}

export function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function formatDateBR(date: Date | string | null | undefined): string {
  if (!date) return '—';
  // Append T12:00:00 to date-only strings to avoid UTC midnight shifting to previous day
  const d = typeof date === 'string' ? new Date(date.length === 10 ? date + 'T12:00:00' : date) : date;
  return d.toLocaleDateString('pt-BR');
}

export function toInputDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  if (typeof date === 'string' && date.length === 10) return date;
  const d = typeof date === 'string' ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ====================================================================
// Funções para Acompanhamento Diário
// ====================================================================

export function eachDayOfInterval(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const current = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
  const endUTC = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()));
  while (current <= endUTC) {
    days.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return days;
}

export function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

export function getWorkingDaysInRange(start: Date, end: Date): number {
  let count = 0;
  const days = eachDayOfInterval(start, end);
  for (const day of days) {
    if (!isWeekend(day)) count++;
  }
  return count;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}
