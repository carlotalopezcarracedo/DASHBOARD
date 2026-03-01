import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, AlertCircle, Receipt, Clock, CheckCircle2, History } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';

export default function Dashboard() {
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/dashboard/stats', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setStats(data));

    fetch('/api/activity?limit=10', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setActivities(data));
  }, [token]);

  if (!stats) return <div className="animate-pulse">Cargando...</div>;

  const statCards = [
    { label: 'Proyectos Activos', value: stats.activeProjects, icon: FolderKanban, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Tareas Próximas (7d)', value: stats.tasksDueSoon, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Facturas Pendientes', value: stats.pendingInvoices, icon: Receipt, color: 'text-zinc-600', bg: 'bg-zinc-100' },
    { label: 'Facturas Vencidas', value: stats.overdueInvoices, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={() => navigate('/clients')}
            className="flex-1 sm:flex-none px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors"
          >
            Ir a Clientes
          </button>
          <button 
            onClick={() => navigate('/projects')}
            className="flex-1 sm:flex-none px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            Ir a Proyectos
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bg)}>
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
              <p className="text-2xl font-semibold text-zinc-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-zinc-200 bg-zinc-50/50">
              <h2 className="font-semibold text-zinc-900">Tareas para Hoy</h2>
            </div>
            <div className="divide-y divide-zinc-100">
              {stats.tasksToday.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-sm">No hay tareas para hoy. ¡Buen trabajo!</div>
              ) : (
                stats.tasksToday.map((task: any) => (
                  <div key={task.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-zinc-300" />
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{task.titulo}</p>
                        <p className="text-xs text-zinc-500">{task.estado}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-zinc-200 bg-zinc-50/50">
              <h2 className="font-semibold text-zinc-900">Próximos 7 días</h2>
            </div>
            <div className="divide-y divide-zinc-100">
              {stats.tasksNext7Days.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-sm">Nada programado para los próximos 7 días.</div>
              ) : (
                stats.tasksNext7Days.map((task: any) => (
                  <div key={task.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{task.titulo}</p>
                        <p className="text-xs text-zinc-500">Vence: {formatDate(task.fecha_vencimiento)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="p-5 border-b border-zinc-200 bg-zinc-50/50 flex items-center gap-2">
            <History className="w-5 h-5 text-zinc-500" />
            <h2 className="font-semibold text-zinc-900">Historial de Actividad</h2>
          </div>
          <div className="divide-y divide-zinc-100 flex-1 overflow-y-auto max-h-[600px]">
            {activities.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">No hay actividad reciente.</div>
            ) : (
              activities.map((activity: any) => (
                <div key={activity.id} className="p-4 hover:bg-zinc-50 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      {activity.entidad}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {new Date(activity.fecha).toLocaleString('es-ES', { 
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-900 font-medium">{activity.detalle}</p>
                  <p className="text-xs text-zinc-500 mt-1">Por: {activity.usuario}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
