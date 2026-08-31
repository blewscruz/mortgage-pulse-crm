import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { KanbanBoard } from './components/KanbanBoard';
import { TaskView } from './components/TaskView';
import { CalendarView } from './components/CalendarView';
import { ListView } from './components/ListView';
import { AnalyticsView } from './components/AnalyticsView';
import { LeadDrawer } from './components/LeadDrawer';
import { NotificationModal } from './components/NotificationModal';
import { AddLeadModal } from './components/AddLeadModal';
import { QuickOutreachModal } from './components/QuickOutreachModal';
import { ScheduleReachOutModal } from './components/ScheduleReachOutModal';
import { EditTaskModal } from './components/EditTaskModal';
import { AppointmentNotifier } from './components/AppointmentNotifier';

import type { Lead, StageId, ViewMode, FilterState, ActivityType, Task } from './types/crm';
import { DEFAULT_STAGES } from './data/stages';
import { filterLeads, generateNotifications, getTodayString } from './utils/crmHelpers';
import { Clock } from 'lucide-react';
import {
  fetchLeadsService,
  upsertLeadService,
  deleteLeadService,
  subscribeToRealtimeLeads,
  getLocalLeads
} from './services/leadService';

const validStageIds = new Set(DEFAULT_STAGES.map((s) => s.id));
const mapLegacyStage = (stage: string): StageId => {
  if (validStageIds.has(stage as StageId)) return stage as StageId;
  switch (stage) {
    case 'new': return 'new_lead';
    case 'contacted': return 'full_application';
    case 'proposal': return 'pitching';
    case 'negotiation': return 'docs_collection';
    case 'disclosures': return 'initial_disclosures';
    case 'underwriting': return 'underwriting_clear_to_close';
    case 'won': return 'funded_closed';
    case 'lost': return 'funded_closed';
    default: return 'new_lead';
  }
};

export const App: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>(() => getLocalLeads());

  // Load leads from Supabase on mount
  const loadLeads = useCallback(async () => {
    const res = await fetchLeadsService();
    if (res.leads) {
      setLeads(res.leads.map((l) => ({ ...l, stage: mapLegacyStage(l.stage) })));
    }
  }, []);

  useEffect(() => {
    loadLeads();
    const unsubscribe = subscribeToRealtimeLeads((updatedLeads) => {
      setLeads(updatedLeads.map((l) => ({ ...l, stage: mapLegacyStage(l.stage) })));
    });

    return () => unsubscribe();
  }, [loadLeads]);

  const [darkMode, setDarkMode] = useState<boolean>(true);
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const [currentView, setCurrentView] = useState<ViewMode>('kanban');

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    stageFilter: 'all',
    priorityFilter: 'all',
    reachOutStatus: 'all',
    minDealValue: 0,
    sortBy: 'due_date_asc',
  });

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [addLeadDefaultStage, setAddLeadDefaultStage] = useState<StageId>('new_lead');

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const [quickOutreachLead, setQuickOutreachLead] = useState<Lead | null>(null);
  const [quickOutreachMode, setQuickOutreachMode] = useState<'call' | 'email' | 'meeting'>('call');
  const [isQuickOutreachOpen, setIsQuickOutreachOpen] = useState(false);

  // Reach-Out Scheduler Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [schedulePreselectedLead, setSchedulePreselectedLead] = useState<Lead | null>(null);
  const [scheduleDefaultDate, setScheduleDefaultDate] = useState<string | undefined>(undefined);

  // Edit Task Modal State
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const notifications = generateNotifications(leads);
  const todayStr = getTodayString();

  const dueTodayCount = leads.filter((l) =>
    l.tasks.some((t) => !t.completed && t.dueDate === todayStr) || l.nextFollowUpDate === todayStr
  ).length;

  const overdueCount = leads.filter((l) =>
    l.tasks.some((t) => !t.completed && t.dueDate < todayStr)
  ).length;

  const totalPipelineValue = leads.reduce((sum, l) => sum + l.value, 0);

  const filteredLeadsList = filterLeads(leads, filters);

  const handleUpdateLead = async (updatedLead: Lead) => {
    setLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)));
    if (selectedLead && selectedLead.id === updatedLead.id) {
      setSelectedLead(updatedLead);
    }
    await upsertLeadService(updatedLead);
  };

  const handleAddLead = async (newLead: Lead) => {
    setLeads((prev) => [newLead, ...prev]);
    await upsertLeadService(newLead);
  };

  const handleDeleteLead = async (leadId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(null);
    }
    await deleteLeadService(leadId);
  };

  const handleToggleTaskComplete = async (leadId: string, taskId: string) => {
    const targetLead = leads.find((l) => l.id === leadId);
    if (!targetLead) return;

    const updatedLead: Lead = {
      ...targetLead,
      tasks: targetLead.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ),
    };

    setLeads((prev) => prev.map((l) => (l.id === leadId ? updatedLead : l)));
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(updatedLead);
    }
    await upsertLeadService(updatedLead);
  };

  const handleOpenEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditTaskOpen(true);
  };

  const handleSaveTask = async (updatedTask: Task) => {
    const targetLead = leads.find((l) => l.id === updatedTask.leadId);
    if (!targetLead) return;

    const updatedLead: Lead = {
      ...targetLead,
      tasks: targetLead.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
    };

    setLeads((prev) => prev.map((l) => (l.id === targetLead.id ? updatedLead : l)));
    if (selectedLead && selectedLead.id === targetLead.id) {
      setSelectedLead(updatedLead);
    }
    await upsertLeadService(updatedLead);
    setIsEditTaskOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = async (leadId: string, taskId: string) => {
    const targetLead = leads.find((l) => l.id === leadId);
    if (!targetLead) return;

    const updatedLead: Lead = {
      ...targetLead,
      tasks: targetLead.tasks.filter((t) => t.id !== taskId),
    };

    setLeads((prev) => prev.map((l) => (l.id === targetLead.id ? updatedLead : l)));
    if (selectedLead && selectedLead.id === targetLead.id) {
      setSelectedLead(updatedLead);
    }
    await upsertLeadService(updatedLead);
  };

  const handleLogOutreach = async (
    leadId: string,
    activityType: ActivityType,
    title: string,
    description: string
  ) => {
    const targetLead = leads.find((l) => l.id === leadId);
    if (!targetLead) return;

    const updatedLead: Lead = {
      ...targetLead,
      lastContactedAt: new Date().toISOString(),
      activities: [
        {
          id: `act-${Date.now()}`,
          type: activityType,
          title,
          description,
          timestamp: new Date().toISOString(),
          author: 'You',
        },
        ...targetLead.activities,
      ],
    };

    setLeads((prev) => prev.map((l) => (l.id === leadId ? updatedLead : l)));
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(updatedLead);
    }
    await upsertLeadService(updatedLead);
  };

  const handleMoveStage = async (leadId: string, newStage: StageId) => {
    const targetLead = leads.find((l) => l.id === leadId);
    if (!targetLead) return;

    const stageObj = DEFAULT_STAGES.find((s) => s.id === newStage);
    const updatedLead: Lead = {
      ...targetLead,
      stage: newStage,
      activities: [
        {
          id: `act-${Date.now()}`,
          type: 'stage_change' as ActivityType,
          title: `Stage updated to ${stageObj ? stageObj.name : newStage}`,
          timestamp: new Date().toISOString(),
          author: 'You',
        },
        ...targetLead.activities,
      ],
    };

    setLeads((prev) => prev.map((l) => (l.id === leadId ? updatedLead : l)));
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(updatedLead);
    }
    await upsertLeadService(updatedLead);
  };

  const handleOpenAddModalForStage = (stageId: StageId) => {
    setAddLeadDefaultStage(stageId);
    setIsAddLeadOpen(true);
  };

  const handleQuickOutreach = (lead: Lead, mode: 'call' | 'email' | 'meeting') => {
    setQuickOutreachLead(lead);
    setQuickOutreachMode(mode);
    setIsQuickOutreachOpen(true);
  };

  const handleOpenScheduleModal = (lead?: Lead, date?: string) => {
    setSchedulePreselectedLead(lead || null);
    setScheduleDefaultDate(date);
    setIsScheduleModalOpen(true);
  };

  const handleScheduleReachOut = async (newTask: Task, notes: string) => {
    const targetLead = leads.find((l) => l.id === newTask.leadId);
    if (!targetLead) return;

    const updatedLead: Lead = {
      ...targetLead,
      nextFollowUpDate: newTask.dueDate,
      tasks: [newTask, ...targetLead.tasks],
      activities: [
        {
          id: `act-${Date.now()}`,
          type: newTask.type === 'meeting' ? 'meeting' : newTask.type === 'email' ? 'email' : 'call',
          title: `Scheduled Reach-Out: ${newTask.title}`,
          description: `Scheduled Date: ${newTask.dueDate} ${newTask.dueTime ? `@ ${newTask.dueTime}` : ''}\nNotes: ${notes}`,
          timestamp: new Date().toISOString(),
          author: 'You',
        },
        ...targetLead.activities,
      ],
    };

    setLeads((prev) => prev.map((l) => (l.id === targetLead.id ? updatedLead : l)));
    if (selectedLead && selectedLead.id === targetLead.id) {
      setSelectedLead(updatedLead);
    }
    await upsertLeadService(updatedLead);
  };

  const handleDismissAlert = async (taskId: string) => {
    const updatedLeads = leads.map((l) => ({
      ...l,
      tasks: l.tasks.map((t) => (t.id === taskId ? { ...t, reminderDismissed: true } : t)),
    }));
    setLeads(updatedLeads);
    const targetLead = updatedLeads.find((l) => l.tasks.some((t) => t.id === taskId));
    if (targetLead) {
      await upsertLeadService(targetLead);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset sample mortgage pipeline data? Any custom lead files will be lost.')) {
      loadLeads();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* 15-Minute Pre-Notification Alert System */}
      <AppointmentNotifier
        leads={leads}
        onSelectLead={setSelectedLead}
        onStartCall={(lead) => handleQuickOutreach(lead, 'call')}
        onDismissAlert={handleDismissAlert}
      />

      {/* Top Header Navbar */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        filters={filters}
        onFilterChange={setFilters}
        notifications={notifications}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenAddLead={() => handleOpenAddModalForStage('new_lead')}
        onOpenScheduleModal={() => handleOpenScheduleModal()}
        onResetData={handleResetData}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        totalPipelineValue={totalPipelineValue}
        dueTodayCount={dueTodayCount}
        overdueCount={overdueCount}
      />

      {/* Action Notification Alert Bar */}
      {(overdueCount > 0 || dueTodayCount > 0) && (
        <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 text-white px-4 py-2 text-xs font-bold shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 animate-pulse shrink-0" />
              <span>
                Loan Outreach Alert: You have <strong>{overdueCount} overdue actions</strong> and{' '}
                <strong>{dueTodayCount} follow-ups scheduled for today</strong>.
              </span>
            </div>
            <button
              onClick={() => setCurrentView('tasks')}
              className="underline font-extrabold hover:text-amber-100 transition-colors shrink-0 ml-2"
            >
              View Daily Action List →
            </button>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'kanban' && (
          <KanbanBoard
            stages={DEFAULT_STAGES}
            leads={filteredLeadsList}
            onSelectLead={setSelectedLead}
            onMoveStage={handleMoveStage}
            onQuickOutreach={handleQuickOutreach}
            onOpenAddLeadWithStage={handleOpenAddModalForStage}
            filters={filters}
            onFilterChange={setFilters}
            onUpdateLead={handleUpdateLead}
          />
        )}

        {currentView === 'calendar' && (
          <CalendarView
            leads={leads}
            onSelectLead={setSelectedLead}
            onQuickOutreach={handleQuickOutreach}
            onOpenScheduleModal={handleOpenScheduleModal}
            onEditTask={handleOpenEditTask}
            onDeleteTask={handleDeleteTask}
          />
        )}

        {currentView === 'tasks' && (
          <TaskView
            leads={leads}
            onToggleTaskComplete={handleToggleTaskComplete}
            onSelectLead={setSelectedLead}
            onQuickOutreach={handleQuickOutreach}
            onEditTask={handleOpenEditTask}
            onDeleteTask={handleDeleteTask}
          />
        )}

        {currentView === 'list' && (
          <ListView
            leads={filteredLeadsList}
            stages={DEFAULT_STAGES}
            onSelectLead={setSelectedLead}
            onMoveStage={handleMoveStage}
            onQuickOutreach={handleQuickOutreach}
            filters={filters}
            onFilterChange={setFilters}
            onUpdateLead={handleUpdateLead}
          />
        )}

        {currentView === 'analytics' && (
          <AnalyticsView
            leads={leads}
            stages={DEFAULT_STAGES}
          />
        )}
      </main>

      {/* Drawer & Modal Overlays */}
      <LeadDrawer
        lead={selectedLead}
        stages={DEFAULT_STAGES}
        onClose={() => setSelectedLead(null)}
        onUpdateLead={handleUpdateLead}
        onDeleteLead={handleDeleteLead}
        onQuickOutreach={handleQuickOutreach}
        onOpenScheduleModal={handleOpenScheduleModal}
        onEditTask={handleOpenEditTask}
        onDeleteTask={handleDeleteTask}
      />

      <AddLeadModal
        isOpen={isAddLeadOpen}
        defaultStage={addLeadDefaultStage}
        stages={DEFAULT_STAGES}
        onClose={() => setIsAddLeadOpen(false)}
        onAddLead={handleAddLead}
      />

      <NotificationModal
        isOpen={isNotificationsOpen}
        notifications={notifications}
        leads={leads}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectLead={(lead) => {
          setSelectedLead(lead);
          setIsNotificationsOpen(false);
        }}
        onQuickOutreach={handleQuickOutreach}
        onMarkAllRead={() => setIsNotificationsOpen(false)}
      />

      <QuickOutreachModal
        isOpen={isQuickOutreachOpen}
        lead={quickOutreachLead}
        mode={quickOutreachMode}
        onClose={() => setIsQuickOutreachOpen(false)}
        onLogOutreach={handleLogOutreach}
      />

      <ScheduleReachOutModal
        isOpen={isScheduleModalOpen}
        leads={leads}
        preselectedLead={schedulePreselectedLead}
        defaultDate={scheduleDefaultDate}
        onClose={() => setIsScheduleModalOpen(false)}
        onSchedule={handleScheduleReachOut}
      />

      <EditTaskModal
        isOpen={isEditTaskOpen}
        task={editingTask}
        onClose={() => {
          setIsEditTaskOpen(false);
          setEditingTask(null);
        }}
        onSaveTask={handleSaveTask}
        onDeleteTask={handleDeleteTask}
      />
    </div>
  );
};

export default App;
