import React from 'react';
import {
    Kanban,
    List,
    CheckSquare,
    BarChart3,
    Plus,
    Search,
    Bell,
    Moon,
    Sun,
    RotateCcw,
    BadgeDollarSign,
    Calendar as CalendarIcon
} from 'lucide-react';
import type { ViewMode, FilterState, NotificationItem } from '../types/crm';
import { formatCurrency } from '../utils/crmHelpers';

interface NavbarProps {
    currentView: ViewMode;
    onViewChange: (view: ViewMode) => void;
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    notifications: NotificationItem[];
    onOpenNotifications: () => void;
    onOpenAddLead: () => void;
    onResetData: () => void;
    darkMode: boolean;
    onToggleDarkMode: () => void;
    totalPipelineValue: number;
    dueTodayCount: number;
    overdueCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
    currentView,
    onViewChange,
    filters,
    onFilterChange,
    notifications,
    onOpenNotifications,
    onOpenAddLead,
    onResetData,
    darkMode,
    onToggleDarkMode,
    totalPipelineValue,
    dueTodayCount,
    overdueCount,
}) => {
    const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

    return (
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Brand Logo & Name */}
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-500/20">
                            <BadgeDollarSign className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center space-x-2">
                                <h1 className="font-black text-lg tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-white dark:via-indigo-200 dark:to-white bg-clip-text text-transparent">
                                    Mortgage Pulse
                                </h1>
                                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                                    Loan Officer CRM
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 hidden sm:block">
                                Loan Pipeline: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{formatCurrency(totalPipelineValue)}</strong>
                            </p>
                        </div>
                    </div>

                    {/* Center View Navigation Tabs */}
                    <nav className="hidden md:flex items-center space-x-1 bg-slate-100/80 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">

                        <button
                            onClick={() => onViewChange('kanban')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all ${currentView === 'kanban'
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                                }`}
                        >
                            <Kanban className="w-3.5 h-3.5" />
                            <span>Mortgage Pipeline</span>
                        </button>

                        <button
                            onClick={() => onViewChange('calendar')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all ${currentView === 'calendar'
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                                }`}
                        >
                            <CalendarIcon className="w-3.5 h-3.5" />
                            <span>Call Calendar</span>
                        </button>

                        <button
                            onClick={() => onViewChange('tasks')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all relative ${currentView === 'tasks'
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                                }`}
                        >
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>Outreach Tasks</span>
                            {(overdueCount > 0 || dueTodayCount > 0) && (
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute top-1 right-1" />
                            )}
                        </button>

                        <button
                            onClick={() => onViewChange('list')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all ${currentView === 'list'
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                                }`}
                        >
                            <List className="w-3.5 h-3.5" />
                            <span>Borrower List</span>
                        </button>

                        <button
                            onClick={() => onViewChange('analytics')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all ${currentView === 'analytics'
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                                }`}
                        >
                            <BarChart3 className="w-3.5 h-3.5" />
                            <span>Volume Analytics</span>
                        </button>

                    </nav>

                    {/* Right Action Tools & Notifications */}
                    <div className="flex items-center space-x-2.5">

                        {/* Global Search Bar */}
                        <div className="relative hidden lg:block w-44 xl:w-56">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search pipeline..."
                                value={filters.searchQuery}
                                onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
                                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400"
                            />
                        </div>

                        {/* Reset Demo Data Button */}
                        <button
                            onClick={onResetData}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Reset Demo Loan Pipeline"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>

                        {/* Dark / Light Toggle */}
                        <button
                            onClick={onToggleDarkMode}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Toggle Color Mode"
                        >
                            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                        </button>

                        {/* Notifications Bell */}
                        <button
                            onClick={onOpenNotifications}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
                            title="Outreach Notifications"
                        >
                            <Bell className="w-4 h-4" />
                            {unreadNotificationsCount > 0 && (
                                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                                    {unreadNotificationsCount}
                                </span>
                            )}
                        </button>

                        {/* Add Borrower File CTA Button */}
                        <button
                            onClick={onOpenAddLead}
                            className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-extrabold shadow-md shadow-indigo-500/20 flex items-center space-x-1.5 transition-all transform hover:scale-[1.02]"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Add Borrower File</span>
                        </button>

                    </div>

                </div>
            </div>
        </header>
    );
};
