import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, LayoutGrid, List, Clock } from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  parseISO,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';

type ViewMode = 'month' | 'week' | 'day';

export default function CalendarView() {
  const token = useAuthStore((state) => state.token);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>('month');
  const [events, setEvents] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  useEffect(() => {
    let start, end;
    if (view === 'month') {
      start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      end = format(endOfMonth(currentDate), 'yyyy-MM-dd');
    } else if (view === 'week') {
      start = format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      end = format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    } else {
      start = format(startOfDay(currentDate), 'yyyy-MM-dd');
      end = format(startOfDay(currentDate), 'yyyy-MM-dd');
    }

    fetch(`/api/calendar/events?start=${start}&end=${end}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setEvents(data.events || []);
        setSubscriptions(data.subscriptions || []);
      });
  }, [currentDate, token, view]);

  const getDays = () => {
    if (view === 'month') {
      return eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
      });
    } else if (view === 'week') {
      return eachDayOfInterval({
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 })
      });
    } else {
      return [startOfDay(currentDate)];
    }
  };

  const days = getDays();

  const handleNext = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handlePrev = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

  const getEventsForDay = (day: Date) => {
    const dayEvents = events.filter(e => e.date && isSameDay(parseISO(e.date), day));
    const daySubs = subscriptions.filter(s => s.dia_cobro_mes === day.getDate()).map(s => ({
      ...s,
      date: format(day, 'yyyy-MM-dd')
    }));
    return [...dayEvents, ...daySubs];
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'task': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'milestone': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'invoice': return 'bg-red-100 text-red-700 border-red-200';
      case 'subscription': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'google': return 'bg-zinc-900 text-white border-zinc-800';
      default: return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  const connectGoogle = async () => {
    const res = await fetch('/api/auth/google/url', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const { url } = await res.json();
    window.open(url, 'google_auth', 'width=600,height=700');
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
        const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');
        fetch(`/api/calendar/events?start=${start}&end=${end}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            setEvents(data.events || []);
            setSubscriptions(data.subscriptions || []);
          });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentDate, token]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendario</h1>
          <p className="text-sm text-zinc-500 mt-1">Gestiona tus eventos y suscripciones</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex bg-zinc-100 p-1 rounded-lg border border-zinc-200">
            <button 
              onClick={() => setView('month')}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                view === 'month' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              Mes
            </button>
            <button 
              onClick={() => setView('week')}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                view === 'week' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              Semana
            </button>
            <button 
              onClick={() => setView('day')}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                view === 'day' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              Día
            </button>
          </div>
          <button 
            onClick={handleToday}
            className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors"
          >
            Hoy
          </button>
          <button 
            onClick={connectGoogle}
            className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors flex items-center gap-2"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4 brightness-0 invert" alt="Google" />
            <span className="hidden sm:inline">Google Calendar</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <button onClick={handlePrev} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold min-w-[150px] text-center capitalize">
              {view === 'day' 
                ? format(currentDate, "d 'de' MMMM yyyy", { locale: es })
                : format(currentDate, 'MMMM yyyy', { locale: es })}
            </h2>
            <button onClick={handleNext} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs text-zinc-500">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Tareas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span>Hitos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Cobros</span>
            </div>
          </div>
        </div>

        {view === 'month' && (
          <>
            <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50/50">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                <div key={day} className="py-3 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-fr">
              {Array.from({ length: (startOfMonth(currentDate).getDay() + 6) % 7 }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[100px] md:min-h-[120px] p-2 border-b border-r border-zinc-100 bg-zinc-50/30" />
              ))}
              
              {days.map(day => {
                const dayEvents = getEventsForDay(day);
                const isToday = isSameDay(day, new Date());
                
                return (
                  <div key={day.toString()} className={cn(
                    "min-h-[100px] md:min-h-[120px] p-2 border-b border-r border-zinc-100 transition-colors hover:bg-zinc-50 group",
                    !isSameMonth(day, currentDate) && "bg-zinc-50/50 text-zinc-400"
                  )}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={cn(
                        "w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium transition-colors",
                        isToday ? "bg-zinc-900 text-white" : "text-zinc-700 group-hover:text-zinc-900"
                      )}>
                        {format(day, 'd')}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {dayEvents.map((event, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            "px-2 py-0.5 text-[10px] md:text-xs rounded border truncate cursor-default transition-all hover:brightness-95",
                            getEventColor(event.type)
                          )}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {view === 'week' && (
          <div className="grid grid-cols-7 divide-x divide-zinc-200 min-h-[500px]">
            {days.map(day => {
              const dayEvents = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div key={day.toString()} className="flex flex-col">
                  <div className={cn(
                    "p-4 border-b border-zinc-200 text-center",
                    isToday ? "bg-zinc-900 text-white" : "bg-zinc-50/50"
                  )}>
                    <p className={cn("text-xs font-medium uppercase tracking-wider mb-1", isToday ? "text-zinc-400" : "text-zinc-500")}>
                      {format(day, 'EEE', { locale: es })}
                    </p>
                    <p className="text-xl font-bold">{format(day, 'd')}</p>
                  </div>
                  <div className="flex-1 p-2 space-y-2 bg-white">
                    {dayEvents.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-[10px] text-zinc-300 italic">Sin eventos</p>
                      </div>
                    ) : (
                      dayEvents.map((event, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            "p-2 text-xs rounded-lg border shadow-sm transition-all hover:scale-[1.02]",
                            getEventColor(event.type)
                          )}
                        >
                          <p className="font-semibold truncate">{event.title}</p>
                          {event.time && (
                            <div className="flex items-center gap-1 mt-1 opacity-70">
                              <Clock className="w-3 h-3" />
                              <span>{event.time}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === 'day' && (
          <div className="p-6 min-h-[400px]">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex flex-col items-center justify-center text-white">
                  <span className="text-xs uppercase font-bold text-zinc-400">{format(currentDate, 'MMM', { locale: es })}</span>
                  <span className="text-2xl font-black leading-none">{format(currentDate, 'd')}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-zinc-900">{format(currentDate, 'EEEE', { locale: es })}</h3>
                  <p className="text-zinc-500">{format(currentDate, "d 'de' MMMM, yyyy", { locale: es })}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {getEventsForDay(currentDate).length === 0 ? (
                  <div className="text-center py-12 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200">
                    <CalendarIcon className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                    <p className="text-zinc-500 font-medium">No hay eventos para hoy</p>
                    <p className="text-sm text-zinc-400">¡Tómate un descanso!</p>
                  </div>
                ) : (
                  getEventsForDay(currentDate).map((event, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border shadow-sm transition-all hover:shadow-md",
                        getEventColor(event.type)
                      )}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-lg">{event.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm opacity-80">
                          <span className="capitalize">{event.type}</span>
                          {event.time && <span>• {event.time}</span>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

