import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDaysIcon,
  ListBulletIcon,
  PlusIcon,
  ClockIcon,
  MapPinIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  UserGroupIcon,
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, addMonths, subMonths, isSameDay, isToday, isSameMonth, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

// Interfaces
interface ScheduleEvent {
  id: string;
  title: string;
  description?: string;
  event_type: 'course' | 'exam' | 'project' | 'personal' | 'meeting';
  start_date: string;
  end_date: string;
  location?: string;
  subject?: string;
  semester?: string;
  is_all_day: boolean;
  is_recurring: boolean;
  recurrence_pattern?: string;
  recurrence_end_date?: string;
  color: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

type ViewMode = 'calendar' | 'list';
type CalendarView = 'month' | 'week';

const Schedule: React.FC = () => {
  const { profile } = useAuth();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [eventFilters, setEventFilters] = useState({
    type: 'all' as string,
    semester: 'all' as string
  });

  // Form state
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    event_type: 'course' as ScheduleEvent['event_type'],
    start_date: '',
    end_date: '',
    location: '',
    subject: '',
    semester: '',
    is_all_day: false,
    color: '#3B82F6'
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('schedule_events')
        .select('*')
        .eq('user_id', profile?.id)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Erreur lors du chargement des événements');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    try {
      // Nettoyer les données : convertir les chaînes vides en null
      const cleanedData = {
        title: eventForm.title,
        description: eventForm.description || null,
        event_type: eventForm.event_type,
        start_date: new Date(eventForm.start_date).toISOString(),
        end_date: new Date(eventForm.end_date).toISOString(),
        location: eventForm.location || null,
        subject: eventForm.subject || null,
        semester: eventForm.semester || null,
        is_all_day: eventForm.is_all_day,
        color: eventForm.color,
        user_id: profile.id
      };

      const { data, error } = await supabase
        .from('schedule_events')
        .insert([cleanedData])
        .select()
        .single();

      if (error) throw error;

      setEvents(prev => [...prev, data]);
      setShowEventModal(false);
      resetForm();
      toast.success('Événement créé avec succès');
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Erreur lors de la création de l\'événement');
    }
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    try {
      // Nettoyer les données : convertir les chaînes vides en null
      const cleanedData = {
        title: eventForm.title,
        description: eventForm.description || null,
        event_type: eventForm.event_type,
        start_date: new Date(eventForm.start_date).toISOString(),
        end_date: new Date(eventForm.end_date).toISOString(),
        location: eventForm.location || null,
        subject: eventForm.subject || null,
        semester: eventForm.semester || null,
        is_all_day: eventForm.is_all_day,
        color: eventForm.color
      };

      const { data, error } = await supabase
        .from('schedule_events')
        .update(cleanedData)
        .eq('id', editingEvent.id)
        .select()
        .single();

      if (error) throw error;

      setEvents(prev => prev.map(event => event.id === editingEvent.id ? data : event));
      setShowEventModal(false);
      setEditingEvent(null);
      resetForm();
      toast.success('Événement modifié avec succès');
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Erreur lors de la modification de l\'événement');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;

    try {
      const { error } = await supabase
        .from('schedule_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      setEvents(prev => prev.filter(event => event.id !== eventId));
      toast.success('Événement supprimé');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setEventForm({
      title: '',
      description: '',
      event_type: 'course',
      start_date: '',
      end_date: '',
      location: '',
      subject: '',
      semester: '',
      is_all_day: false,
      color: '#3B82F6'
    });
  };

  const openEditModal = (event: ScheduleEvent) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || '',
      event_type: event.event_type,
      start_date: format(new Date(event.start_date), "yyyy-MM-dd'T'HH:mm"),
      end_date: format(new Date(event.end_date), "yyyy-MM-dd'T'HH:mm"),
      location: event.location || '',
      subject: event.subject || '',
      semester: event.semester || '',
      is_all_day: event.is_all_day,
      color: event.color
    });
    setShowEventModal(true);
  };

  const getEventTypeIcon = (type: ScheduleEvent['event_type']) => {
    switch (type) {
      case 'course': return <AcademicCapIcon className="h-4 w-4" />;
      case 'exam': return <DocumentTextIcon className="h-4 w-4" />;
      case 'project': return <DocumentTextIcon className="h-4 w-4" />;
      case 'meeting': return <UserGroupIcon className="h-4 w-4" />;
      case 'personal': return <UserIcon className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getEventTypeLabel = (type: ScheduleEvent['event_type']) => {
    switch (type) {
      case 'course': return 'Cours';
      case 'exam': return 'Examen';
      case 'project': return 'Projet';
      case 'meeting': return 'Réunion';
      case 'personal': return 'Personnel';
      default: return type;
    }
  };

  const filteredEvents = events.filter(event => {
    const typeMatch = eventFilters.type === 'all' || event.event_type === eventFilters.type;
    const semesterMatch = eventFilters.semester === 'all' || event.semester === eventFilters.semester;
    return typeMatch && semesterMatch;
  });

  const navigateDate = (direction: 'prev' | 'next') => {
    if (calendarView === 'month') {
      setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
    } else {
      setCurrentDate(prev => direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1));
    }
  };

  const getDaysInView = () => {
    if (calendarView === 'month') {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
  };

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event =>
      isSameDay(new Date(event.start_date), date)
    );
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Chargement du planning...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
              <CalendarDaysIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Planning & Emploi du Temps
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gérez vos cours, examens et événements
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-2 rounded-l-lg text-sm font-medium ${
                  viewMode === 'calendar'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <CalendarDaysIcon className="h-4 w-4 inline mr-2" />
                Calendrier
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-r-lg text-sm font-medium ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <ListBulletIcon className="h-4 w-4 inline mr-2" />
                Liste
              </button>
            </div>

            <button
              onClick={() => setShowEventModal(true)}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Nouvel événement</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type:</label>
            <select
              value={eventFilters.type}
              onChange={(e) => setEventFilters(prev => ({ ...prev, type: e.target.value }))}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Tous</option>
              <option value="course">Cours</option>
              <option value="exam">Examens</option>
              <option value="project">Projets</option>
              <option value="meeting">Réunions</option>
              <option value="personal">Personnel</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Semestre:</label>
            <select
              value={eventFilters.semester}
              onChange={(e) => setEventFilters(prev => ({ ...prev, semester: e.target.value }))}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Tous</option>
              <option value="S1">S1</option>
              <option value="S2">S2</option>
              <option value="S3">S3</option>
              <option value="S4">S4</option>
              <option value="S5">S5</option>
              <option value="S6">S6</option>
              <option value="S7">S7</option>
            </select>
          </div>
        </div>
      </div>

      {/* Calendar/List View */}
      {viewMode === 'calendar' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {format(currentDate, 'MMMM yyyy', { locale: fr })}
              </h2>
              <div className="flex rounded-lg border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setCalendarView('month')}
                  className={`px-3 py-1 text-sm font-medium rounded-l-lg ${
                    calendarView === 'month'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Mois
                </button>
                <button
                  onClick={() => setCalendarView('week')}
                  className={`px-3 py-1 text-sm font-medium rounded-r-lg ${
                    calendarView === 'week'
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Semaine
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"
              >
                Aujourd'hui
              </button>
              <button
                onClick={() => navigateDate('next')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-6">
            {calendarView === 'month' ? (
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                  <div key={day} className="p-4 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {getDaysInView().map((date, index) => {
                  const dayEvents = getEventsForDate(date);
                  const isCurrentMonth = isSameMonth(date, currentDate);

                  return (
                    <div
                      key={date.toISOString()}
                      className={`min-h-[120px] p-2 border border-gray-200 dark:border-gray-600 ${
                        isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'
                      } ${isToday(date) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                    >
                      <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {format(date, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            className="text-xs p-1 rounded cursor-pointer hover:opacity-80"
                            style={{ backgroundColor: event.color + '20', borderLeft: `3px solid ${event.color}` }}
                            onClick={() => openEditModal(event)}
                          >
                            <div className="font-medium truncate" style={{ color: event.color }}>
                              {event.title}
                            </div>
                            {!event.is_all_day && (
                              <div className="text-gray-600 dark:text-gray-400">
                                {format(new Date(event.start_date), 'HH:mm')}
                              </div>
                            )}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            +{dayEvents.length - 3} autres
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {getDaysInView().map(date => {
                  const dayEvents = getEventsForDate(date);
                  if (dayEvents.length === 0) return null;

                  return (
                    <div key={date.toISOString()} className="border-l-4 border-indigo-500 pl-4">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                        {format(date, 'EEEE d MMMM', { locale: fr })}
                      </h3>
                      <div className="space-y-2">
                        {dayEvents.map(event => (
                          <div
                            key={event.id}
                            className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:opacity-80"
                            style={{ backgroundColor: event.color + '10', borderLeft: `4px solid ${event.color}` }}
                            onClick={() => openEditModal(event)}
                          >
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                {getEventTypeIcon(event.event_type)}
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {event.title}
                                </span>
                                <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: event.color + '20', color: event.color }}>
                                  {getEventTypeLabel(event.event_type)}
                                </span>
                              </div>
                              {!event.is_all_day && (
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {format(new Date(event.start_date), 'HH:mm')} - {format(new Date(event.end_date), 'HH:mm')}
                                </div>
                              )}
                              {event.location && (
                                <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                                  <MapPinIcon className="h-4 w-4" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(event);
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteEvent(event.id);
                                }}
                                className="text-red-400 hover:text-red-600"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Liste des événements
            </h2>

            {filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Aucun événement trouvé
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map(event => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => openEditModal(event)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-2">
                          {getEventTypeIcon(event.event_type)}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {event.title}
                          </span>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: event.color + '20', color: event.color }}>
                          {getEventTypeLabel(event.event_type)}
                        </span>
                        {event.semester && (
                          <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                            {event.semester}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <CalendarDaysIcon className="h-4 w-4" />
                          <span>{format(new Date(event.start_date), 'dd/MM/yyyy', { locale: fr })}</span>
                        </div>
                        {!event.is_all_day && (
                          <div className="flex items-center space-x-1">
                            <ClockIcon className="h-4 w-4" />
                            <span>
                              {format(new Date(event.start_date), 'HH:mm')} - {format(new Date(event.end_date), 'HH:mm')}
                            </span>
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center space-x-1">
                            <MapPinIcon className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>

                      {event.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 truncate">
                          {event.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(event);
                        }}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEvent(event.id);
                        }}
                        className="text-red-400 hover:text-red-600 p-2"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingEvent ? 'Modifier l\'événement' : 'Nouvel événement'}
              </h3>
              <button
                onClick={() => {
                  setShowEventModal(false);
                  setEditingEvent(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Titre de l'événement"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type d'événement *
                </label>
                <select
                  required
                  value={eventForm.event_type}
                  onChange={(e) => setEventForm(prev => ({ ...prev, event_type: e.target.value as ScheduleEvent['event_type'] }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="course">Cours</option>
                  <option value="exam">Examen</option>
                  <option value="project">Projet</option>
                  <option value="meeting">Réunion</option>
                  <option value="personal">Personnel</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date de début *
                  </label>
                  <input
                    type="datetime-local"
                    required={!eventForm.is_all_day}
                    value={eventForm.start_date}
                    onChange={(e) => setEventForm(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date de fin *
                  </label>
                  <input
                    type="datetime-local"
                    required={!eventForm.is_all_day}
                    value={eventForm.end_date}
                    onChange={(e) => setEventForm(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_all_day"
                  checked={eventForm.is_all_day}
                  onChange={(e) => setEventForm(prev => ({ ...prev, is_all_day: e.target.checked }))}
                  className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="is_all_day" className="text-sm text-gray-700 dark:text-gray-300">
                  Toute la journée
                </label>
              </div>

              {(eventForm.event_type === 'course' || eventForm.event_type === 'exam' || eventForm.event_type === 'project') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Matière
                    </label>
                    <input
                      type="text"
                      value={eventForm.subject}
                      onChange={(e) => setEventForm(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ex: Mathématiques"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Semestre
                    </label>
                    <select
                      value={eventForm.semester}
                      onChange={(e) => setEventForm(prev => ({ ...prev, semester: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Sélectionner</option>
                      <option value="S1">S1</option>
                      <option value="S2">S2</option>
                      <option value="S3">S3</option>
                      <option value="S4">S4</option>
                      <option value="S5">S5</option>
                      <option value="S6">S6</option>
                      <option value="S7">S7</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lieu
                </label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Salle, adresse, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Détails supplémentaires..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Couleur
                </label>
                <input
                  type="color"
                  value={eventForm.color}
                  onChange={(e) => setEventForm(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEventModal(false);
                    setEditingEvent(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  {editingEvent ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Schedule;