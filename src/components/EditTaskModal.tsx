import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Bell, FileText, Trash2, Save } from 'lucide-react';
import type { Task, Priority } from '../types/crm';

interface EditTaskModalProps {
    isOpen: boolean;
    task: Task | null;
    onClose: () => void;
    onSaveTask: (updatedTask: Task) => void;
    onDeleteTask: (leadId: string, taskId: string) => void;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
    isOpen,
    task,
    onClose,
    onSaveTask,
    onDeleteTask,
}) => {
    if (!isOpen || !task) return null;

    const [title, setTitle] = useState(task.title);
    const [dueDate, setDueDate] = useState(task.dueDate);
    const [dueTime, setDueTime] = useState(task.dueTime || '10:00');
    const [type, setType] = useState<'call' | 'meeting' | 'email' | 'followup' | 'proposal'>(task.type);
    const [priority, setPriority] = useState<Priority>(task.priority);
    const [description, setDescription] = useState(task.description || '');
    const [reminderMinutes, setReminderMinutes] = useState<number>(task.reminderMinutes ?? 15);

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDueDate(task.dueDate);
            setDueTime(task.dueTime || '10:00');
            setType(task.type);
            setPriority(task.priority);
            setDescription(task.description || '');
            setReminderMinutes(task.reminderMinutes ?? 15);
        }
    }, [task]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const updated: Task = {
            ...task,
            title: title.trim(),
            dueDate: dueDate,
            dueTime: dueTime,
            type: type,
            priority: priority,
            description: description.trim(),
            reminderMinutes: reminderMinutes,
        };

        onSaveTask(updated);
        onClose();
    };

    const handleDelete = () => {
        if (window.confirm(`Delete calendar item "${task.title}"?`)) {
            onDeleteTask(task.leadId, task.id);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Modal Header */}
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-slate-900 dark:to-slate-900 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                Calendar Event Editor
                            </span>
                            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                                Edit Scheduled Item • {task.leadName}
                            </h3>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Title */}
                    <div>
                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                            Event Title / Subject
                        </label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-3 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100"
                        />
                    </div>

                    {/* Event Type & Priority */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                                Event Category / Type
                            </label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as any)}
                                className="w-full p-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                            >
                                <option value="call">📞 Phone Call</option>
                                <option value="followup">📋 Follow-up Task</option>
                                <option value="meeting">🎥 Pitch / Zoom Meeting</option>
                                <option value="proposal">✍️ Disclosures / E-Sign</option>
                                <option value="email">✉️ Email Update</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                                Priority Level
                            </label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as Priority)}
                                className="w-full p-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                            >
                                <option value="high">🔴 High Priority</option>
                                <option value="medium">🟡 Medium Priority</option>
                                <option value="low">🟢 Low Priority</option>
                            </select>
                        </div>
                    </div>

                    {/* Date and Time Picker */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Move to Date</span>
                            </label>
                            <input
                                type="date"
                                required
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full p-2.5 text-xs font-extrabold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                                <Clock className="w-3.5 h-3.5 text-amber-500" />
                                <span>Change Time</span>
                            </label>
                            <input
                                type="time"
                                required
                                value={dueTime}
                                onChange={(e) => setDueTime(e.target.value)}
                                className="w-full p-2.5 text-xs font-extrabold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                            />
                        </div>
                    </div>

                    {/* Agenda & Notes */}
                    <div>
                        <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                            <FileText className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Notes & Agenda</span>
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Add details about what this call or task is about..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 leading-relaxed"
                        />
                    </div>

                    {/* 15-Minute Alert Checkbox */}
                    <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-xl bg-indigo-600 text-white">
                                <Bell className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="font-black text-xs text-indigo-900 dark:text-indigo-200 block">
                                    15-Minute Pre-Notification Alert
                                </span>
                                <span className="text-[10px] text-indigo-700 dark:text-indigo-400">
                                    Chime & pop-up notification 15 mins prior
                                </span>
                            </div>
                        </div>

                        <input
                            type="checkbox"
                            checked={reminderMinutes === 15}
                            onChange={(e) => setReminderMinutes(e.target.checked ? 15 : 0)}
                            className="w-5 h-5 text-indigo-600 rounded-lg border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="py-3 px-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-extrabold text-xs border border-rose-200 dark:border-rose-800/60 flex items-center justify-center space-x-1.5 transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Event</span>
                        </button>

                        <button
                            type="submit"
                            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-all"
                        >
                            <Save className="w-4 h-4" />
                            <span>Save Changes</span>
                        </button>
                    </div>

                </form>

            </div>
        </div>
    );
};
