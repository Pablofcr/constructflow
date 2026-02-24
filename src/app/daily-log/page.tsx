"use client";

import { useState, useEffect, useCallback } from "react";
import { useProject } from "@/contexts/project-context";
import { Sidebar } from "@/components/sidebar";
import {
  Activity,
  Loader2,
  CalendarClock,
  TrendingUp,
  BarChart3,
  ClipboardList,
} from "lucide-react";
import { DailyTrackingHeader } from "@/components/acompanhamento/DailyTrackingHeader";
import { DateNavigator } from "@/components/acompanhamento/DateNavigator";
import { DailySummaryCard } from "@/components/acompanhamento/DailySummaryCard";
import {
  DailyAttestationForm,
} from "@/components/acompanhamento/DailyAttestationForm";
import { SCurveChart } from "@/components/acompanhamento/SCurveChart";
import { DeviationDashboard } from "@/components/acompanhamento/DeviationDashboard";
import type { AttestationEntry } from "@/components/acompanhamento/DailyAttestationCard";
import Link from "next/link";

interface TrackingOverview {
  id: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  overallProgress: number;
  totalBudget: number;
  hasBaseline: boolean;
  baselineFrozenAt: string | null;
  stages: Array<{
    id: string;
    name: string;
    order: number;
    progressPercent: number;
    budgetPercentage: number;
  }>;
  dailyLogs: Array<{
    id: string;
    date: string;
    status: string;
    notes: string | null;
    weather: string | null;
  }>;
}

interface DayData {
  id: string;
  date: string;
  status: string;
  notes: string | null;
  weather: string | null;
  entries: AttestationEntry[];
}

type Tab = "diario" | "curva-s" | "indicadores";

export default function DailyLogPage() {
  const { activeProject } = useProject();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<TrackingOverview | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("diario");
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
  const [dayData, setDayData] = useState<DayData | null>(null);
  const [dayLoading, setDayLoading] = useState(false);

  // Fetch the active planning for this project
  const fetchOverview = useCallback(async () => {
    if (!activeProject) {
      setOverview(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // First get the active planning
      const planningRes = await fetch(
        `/api/planning?projectId=${activeProject.id}`
      );
      if (!planningRes.ok) {
        setOverview(null);
        return;
      }

      const plannings = await planningRes.json();
      const activePlanning = Array.isArray(plannings)
        ? plannings.find((p: { status: string }) => p.status === "ACTIVE")
        : null;

      if (!activePlanning) {
        setOverview(null);
        return;
      }

      // Fetch tracking overview
      const trackingRes = await fetch(
        `/api/daily-tracking/${activePlanning.id}`
      );
      if (trackingRes.ok) {
        setOverview(await trackingRes.json());
      } else {
        setOverview(null);
      }
    } catch {
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }, [activeProject]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Fetch day data when date changes
  const fetchDayData = useCallback(async () => {
    if (!overview) return;

    try {
      setDayLoading(true);
      const res = await fetch(
        `/api/daily-tracking/${overview.id}/day?date=${currentDate}`
      );
      if (res.ok) {
        setDayData(await res.json());
      }
    } catch {
      // silent
    } finally {
      setDayLoading(false);
    }
  }, [overview, currentDate]);

  useEffect(() => {
    if (overview && activeTab === "diario") {
      fetchDayData();
    }
  }, [overview, currentDate, activeTab, fetchDayData]);

  // Handle attestation
  const handleAttest = async (data: {
    entries: Array<{
      serviceId: string;
      executedAsPlanned: boolean;
      actualPercent?: number;
    }>;
    notes?: string;
    weather?: string;
  }) => {
    if (!overview) return;

    const res = await fetch(
      `/api/daily-tracking/${overview.id}/attest`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: currentDate,
          ...data,
        }),
      }
    );

    if (res.ok) {
      // Refresh data
      await fetchOverview();
      await fetchDayData();
    }
  };

  const tabs: Array<{ id: Tab; label: string; icon: typeof ClipboardList }> = [
    { id: "diario", label: "Diario", icon: ClipboardList },
    { id: "curva-s", label: "Curva S", icon: TrendingUp },
    { id: "indicadores", label: "Indicadores", icon: BarChart3 },
  ];

  // ======================================================================
  // No project selected
  // ======================================================================
  if (!activeProject) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 md:ml-20">
          <div className="max-w-5xl mx-auto p-4 md:p-6">
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Activity className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Selecione um Projeto
              </h2>
              <p className="text-sm text-gray-500 max-w-md">
                Para acessar o acompanhamento diario, selecione um projeto no
                menu superior.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ======================================================================
  // Loading
  // ======================================================================
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 md:ml-20">
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  // ======================================================================
  // No active planning
  // ======================================================================
  if (!overview) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 md:ml-20">
          <div className="max-w-5xl mx-auto p-4 md:p-6">
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                <CalendarClock className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Ative um Planejamento Primeiro
              </h2>
              <p className="text-sm text-gray-500 max-w-md mb-6">
                O acompanhamento diario requer um planejamento com status
                &quot;Ativo&quot;. Acesse o planejamento e altere o status para
                comecar a acompanhar.
              </p>
              <Link
                href="/planning"
                className="px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                Ir para Planejamento
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Compute day summary
  const dayEntries = dayData?.entries || [];
  const totalServices = dayEntries.length;
  const attestedEntries = dayEntries.filter((e) => e.executedAsPlanned);
  const deficitEntries = dayEntries.filter(
    (e) => dayData?.status === "ATTESTED" && e.deficitPercent > 0
  );
  const dayProgress =
    totalServices > 0
      ? dayEntries.reduce((sum, e) => sum + e.actualPercent, 0) /
        totalServices
      : 0;

  // ======================================================================
  // Main content
  // ======================================================================
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 md:ml-20">
        <div className="max-w-5xl mx-auto p-4 md:p-6">
          {/* Header */}
          <DailyTrackingHeader
            planningName={overview.name}
            planningStatus={overview.status}
            overallProgress={overview.overallProgress}
            hasBaseline={overview.hasBaseline}
          />

          {/* Tabs */}
          <div className="flex bg-white rounded-xl border border-gray-200 p-1 mb-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeTab === "diario" && (
            <div>
              <DateNavigator
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                dailyLogs={overview.dailyLogs}
              />

              {dayLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : dayData ? (
                <>
                  {dayData.status === "ATTESTED" && (
                    <DailySummaryCard
                      totalServices={totalServices}
                      attestedCount={attestedEntries.length}
                      deficitCount={deficitEntries.length}
                      dayProgress={dayProgress}
                    />
                  )}
                  <DailyAttestationForm
                    key={dayData.id}
                    entries={dayData.entries}
                    isAttested={dayData.status === "ATTESTED"}
                    dailyLogNotes={dayData.notes}
                    dailyLogWeather={dayData.weather}
                    onAttest={handleAttest}
                  />
                </>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <p className="text-sm text-gray-500">
                    Nenhum dado disponivel para esta data.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "curva-s" && (
            <SCurveChart planningId={overview.id} />
          )}

          {activeTab === "indicadores" && (
            <DeviationDashboard planningId={overview.id} />
          )}
        </div>
      </div>
    </div>
  );
}
