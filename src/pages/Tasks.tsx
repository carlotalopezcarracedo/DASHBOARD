import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth';
import { Plus, CheckCircle2, Circle, MoreVertical, Clock, Calendar } from 'lucide-react';
import { formatDate } from '../lib/utils';
import Modal from '../components/Modal';

export default function Tasks() {
  const token = useAuthStore((state) => state.token);
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskHistory, setTaskHistory] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    titulo: '',
    project_id: '',
    fecha_vencimiento: ''
  });

  useEffect(() => {
    fetch('/api/tasks', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setTasks(data));
      
    fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setProjects(data));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(formData)
    });
    
    if (res.ok) {
      const newTask = await res.json();
      const project = projects.find(p => p.id === newTask.project_id);
      setTasks([{...newTask, nombre_proyecto: project?.nombre_proyecto}, ...tasks]);
      setIsModalOpen(false);
      setFormData({ titulo: '', project_id: '', fecha_vencimiento: '' });
    }
  };

  const toggleTask = async (id: string, newStatus?: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const targetStatus = newStatus || (task.estado === 'lista' ? 'por_hacer' : 'lista');
    
    await fetch(`/api/tasks/${id}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ estado: targetStatus })
    });
    setTasks(tasks.map(t => t.id === id ? { ...t, estado: targetStatus } : t));
    
    if (selectedTask && selectedTask.id === id) {
      setSelectedTask({ ...selectedTask, estado: targetStatus });
      fetchTaskHistory(id);
    }
  };

  const fetchTaskHistory = async (id: string) => {
    const res = await fetch(`/api/activity/task/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setTaskHistory(data);
    }
  };

  const openTaskDetails = (task: any) => {
    setSelectedTask(task);
    setIsDetailsModalOpen(true);
    fetchTaskHistory(task.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Tareas</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Tarea
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-zinc-100">
          {tasks.map((task) => (
            <div key={task.id} onClick={() => openTaskDetails(task)} className={`p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors cursor-pointer ${task.estado === 'lista' ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-4">
                <button onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}>
                  {task.estado === 'lista' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-zinc-300 hover:text-zinc-400" />
                  )}
                </button>
                <div>
                  <p className={`text-sm font-medium ${task.estado === 'lista' ? 'text-zinc-500 line-through' : 'text-zinc-900'}`}>
                    {task.titulo}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">{task.nombre_proyecto}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <select
                  value={task.estado}
                  onChange={(e) => toggleTask(task.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize border-0 focus:ring-2 focus:ring-zinc-900 cursor-pointer
                    ${task.estado === 'lista' ? 'bg-emerald-50 text-emerald-700' : 
                      task.estado === 'en_progreso' ? 'bg-blue-50 text-blue-700' : 
                      'bg-zinc-100 text-zinc-700'}`}
                >
                  <option value="por_hacer">Por hacer</option>
                  <option value="en_progreso">En progreso</option>
                  <option value="lista">Lista</option>
                </select>
                <span className="text-xs text-zinc-500 w-24 text-right">
                  {formatDate(task.fecha_vencimiento)}
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); openTaskDetails(task); }}
                  className="p-1 text-zinc-400 hover:text-zinc-900 rounded"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva Tarea">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Título de la Tarea</label>
            <input 
              type="text" required
              value={formData.titulo}
              onChange={e => setFormData({...formData, titulo: e.target.value})}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Proyecto</label>
            <select 
              required
              value={formData.project_id}
              onChange={e => setFormData({...formData, project_id: e.target.value})}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
            >
              <option value="">Selecciona un proyecto...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.nombre_proyecto}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Fecha de Vencimiento</label>
            <input 
              type="date" required
              value={formData.fecha_vencimiento}
              onChange={e => setFormData({...formData, fecha_vencimiento: e.target.value})}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
            />
          </div>
          <button type="submit" className="w-full mt-4 bg-zinc-900 text-white py-2 rounded-lg font-medium hover:bg-zinc-800">
            Añadir Tarea
          </button>
        </form>
      </Modal>

      <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Detalles de la Tarea">
        {selectedTask && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900">{selectedTask.titulo}</h2>
                <div className="flex items-center gap-2 text-zinc-500 mt-1">
                  <Calendar className="w-4 h-4" />
                  <span>{selectedTask.nombre_proyecto}</span>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium capitalize
                ${selectedTask.estado === 'lista' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' : 
                  selectedTask.estado === 'en_progreso' ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20' : 
                  'bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-500/20'}`}>
                {selectedTask.estado.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                <p className="text-xs font-medium text-zinc-500 mb-1">Fecha Creación</p>
                <p className="text-sm text-zinc-900">{formatDate(selectedTask.fecha_creacion)}</p>
              </div>
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                <p className="text-xs font-medium text-zinc-500 mb-1">Vencimiento</p>
                <p className="text-sm text-zinc-900">{formatDate(selectedTask.fecha_vencimiento)}</p>
              </div>
            </div>

            <div className="border-t border-zinc-200 pt-6">
              <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-500" />
                Historial de Actividad
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {taskHistory.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4">No hay actividad registrada.</p>
                ) : (
                  taskHistory.map(log => (
                    <div key={log.id} className="bg-white p-3 rounded-lg border border-zinc-200 text-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-zinc-900">{log.detalle}</span>
                        <span className="text-xs text-zinc-400 whitespace-nowrap ml-2">
                          {new Date(log.fecha).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">Por: {log.usuario}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
