import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth';
import { Plus, LayoutGrid, List, CheckSquare, ChevronDown, ChevronRight, MoreVertical, Clock, Building2, Calendar } from 'lucide-react';
import { formatDate } from '../lib/utils';
import Modal from '../components/Modal';

export default function Projects() {
  const token = useAuthStore((state) => state.token);
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [projectHistory, setProjectHistory] = useState<any[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    client_id: '',
    nombre_proyecto: '',
    tipo: 'automatizacion_interna',
    estado: 'en_propuesta',
    prioridad: 'media',
    fecha_entrega_objetivo: ''
  });

  useEffect(() => {
    fetch('/api/projects', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setProjects(data));
      
    fetch('/api/clients', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setClients(data));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({
        ...formData,
        fecha_inicio: new Date().toISOString().split('T')[0]
      })
    });
    
    if (res.ok) {
      const newProject = await res.json();
      const client = clients.find(c => c.id === newProject.client_id);
      setProjects([{...newProject, nombre_cliente: client?.nombre_cliente}, ...projects]);
      setIsModalOpen(false);
      setFormData({ client_id: '', nombre_proyecto: '', tipo: 'automatizacion_interna', estado: 'en_propuesta', prioridad: 'media', fecha_entrega_objetivo: '' });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/projects/${id}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ estado: newStatus })
    });
    
    if (res.ok) {
      setProjects(projects.map(p => p.id === id ? { ...p, estado: newStatus } : p));
      if (selectedProject && selectedProject.id === id) {
        setSelectedProject({ ...selectedProject, estado: newStatus });
        fetchProjectHistory(id);
      }
    }
  };

  const fetchProjectHistory = async (id: string) => {
    const res = await fetch(`/api/activity/project/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setProjectHistory(data);
    }
  };

  const openProjectDetails = (project: any) => {
    setSelectedProject(project);
    setIsDetailsModalOpen(true);
    fetchProjectHistory(project.id);
  };

  const openChecklist = async (project: any) => {
    setSelectedProject(project);
    setIsChecklistModalOpen(true);
    
    // Fetch existing checklists
    const res = await fetch(`/api/projects/${project.id}/checklists`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    
    if (data.length === 0) {
      // Initialize if empty
      const initRes = await fetch(`/api/projects/${project.id}/checklists/init`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (initRes.ok) {
        const newData = await initRes.json();
        setChecklists(newData);
        initializeExpandedState(newData);
      }
    } else {
      setChecklists(data);
      initializeExpandedState(data);
    }
  };

  const initializeExpandedState = (data: any[]) => {
    const categories = [...new Set(data.map(item => item.category))];
    const initialState: Record<string, boolean> = {};
    categories.forEach(cat => {
      initialState[cat as string] = true; // Expand all by default
    });
    setExpandedCategories(initialState);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleChecklistItem = async (itemId: string, currentStatus: number) => {
    if (!selectedProject) return;
    
    const newStatus = currentStatus === 1 ? 0 : 1;
    
    // Optimistic update
    setChecklists(checklists.map(item => 
      item.id === itemId ? { ...item, is_completed: newStatus } : item
    ));

    await fetch(`/api/projects/${selectedProject.id}/checklists/${itemId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ is_completed: newStatus })
    });
  };

  // Group checklists by category
  const groupedChecklists = checklists.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  // Sort categories by the number prefix (e.g., "0)", "1)")
  const sortedCategories = Object.keys(groupedChecklists).sort((a, b) => {
    const numA = parseInt(a.split(')')[0]) || 0;
    const numB = parseInt(b.split(')')[0]) || 0;
    return numA - numB;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Proyectos</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex flex-1 sm:flex-none bg-zinc-100 p-1 rounded-lg border border-zinc-200">
            <button 
              onClick={() => setView('table')}
              className={`flex-1 sm:flex-none p-1.5 rounded-md flex justify-center ${view === 'table' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setView('kanban')}
              className={`flex-1 sm:flex-none p-1.5 rounded-md flex justify-center ${view === 'kanban' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="whitespace-nowrap">Nuevo Proyecto</span>
          </button>
        </div>
      </div>

      {view === 'table' ? (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500">
              <tr>
                <th className="px-6 py-3 font-medium">Proyecto</th>
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium">Entrega</th>
                <th className="px-6 py-3 font-medium">Prioridad</th>
                <th className="px-6 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {projects.map((project) => (
                <tr key={project.id} onClick={() => openProjectDetails(project)} className="hover:bg-zinc-50 transition-colors cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-900">{project.nombre_proyecto}</div>
                    <div className="text-zinc-500 text-xs mt-0.5 capitalize">{project.tipo.replace(/_/g, ' ')}</div>
                  </td>
                  <td className="px-6 py-4 text-zinc-600">{project.nombre_cliente}</td>
                  <td className="px-6 py-4">
                    <select
                      value={project.estado}
                      onChange={(e) => handleStatusChange(project.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize border-0 focus:ring-2 focus:ring-zinc-900 cursor-pointer
                        ${project.estado === 'entregado' ? 'bg-emerald-50 text-emerald-700' : 
                          project.estado === 'en_desarrollo' ? 'bg-blue-50 text-blue-700' : 
                          'bg-zinc-100 text-zinc-700'}`}
                    >
                      <option value="en_propuesta">En Propuesta</option>
                      <option value="aprobado">Aprobado</option>
                      <option value="en_desarrollo">En Desarrollo</option>
                      <option value="entregado">Entregado</option>
                      <option value="pausado">Pausado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-zinc-500">{formatDate(project.fecha_entrega_objetivo)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize
                      ${project.prioridad === 'alta' ? 'bg-red-50 text-red-700' : 
                        project.prioridad === 'media' ? 'bg-amber-50 text-amber-700' : 
                        'bg-zinc-100 text-zinc-700'}`}>
                      {project.prioridad}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openChecklist(project); }}
                        className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                        title="Checklist de Implementación"
                      >
                        <CheckSquare className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); openProjectDetails(project); }}
                        className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start">
          {['en_propuesta', 'aprobado', 'en_desarrollo', 'entregado'].map(status => (
            <div key={status} className="bg-zinc-100/50 rounded-xl p-4 border border-zinc-200/50">
              <h3 className="font-medium text-sm text-zinc-500 mb-3 capitalize">{status.replace(/_/g, ' ')}</h3>
              <div className="space-y-3">
                {projects.filter(p => p.estado === status).map(project => (
                  <div key={project.id} onClick={() => openProjectDetails(project)} className="bg-white p-4 rounded-lg border border-zinc-200 shadow-sm cursor-pointer hover:border-zinc-300 transition-colors group">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-medium text-zinc-900 text-sm">{project.nombre_proyecto}</h4>
                      <button
                        onClick={(e) => { e.stopPropagation(); openChecklist(project); }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-all"
                        title="Checklist de Implementación"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500 mb-3">{project.nombre_cliente}</p>
                    <div className="flex justify-between items-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium capitalize
                        ${project.prioridad === 'alta' ? 'bg-red-50 text-red-700' : 'bg-zinc-100 text-zinc-700'}`}>
                        {project.prioridad}
                      </span>
                      <span className="text-xs text-zinc-400">{formatDate(project.fecha_entrega_objetivo)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Proyecto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre del Proyecto</label>
            <input 
              type="text" required
              value={formData.nombre_proyecto}
              onChange={e => setFormData({...formData, nombre_proyecto: e.target.value})}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Cliente</label>
            <select 
              required
              value={formData.client_id}
              onChange={e => setFormData({...formData, client_id: e.target.value})}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
            >
              <option value="">Selecciona un cliente...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.nombre_cliente} ({c.nombre_negocio})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Tipo</label>
              <select 
                value={formData.tipo}
                onChange={e => setFormData({...formData, tipo: e.target.value})}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
              >
                <option value="IA_whatsapp_citas">Bot WhatsApp</option>
                <option value="automatizacion_interna">Automatización</option>
                <option value="CRM">CRM</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Entrega Objetivo</label>
              <input 
                type="date" required
                value={formData.fecha_entrega_objetivo}
                onChange={e => setFormData({...formData, fecha_entrega_objetivo: e.target.value})}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
              />
            </div>
          </div>
          <button type="submit" className="w-full mt-4 bg-zinc-900 text-white py-2 rounded-lg font-medium hover:bg-zinc-800">
            Crear Proyecto
          </button>
        </form>
      </Modal>

      <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Detalles del Proyecto">
        {selectedProject && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900">{selectedProject.nombre_proyecto}</h2>
                <div className="flex items-center gap-2 text-zinc-500 mt-1">
                  <Building2 className="w-4 h-4" />
                  <span>{selectedProject.nombre_cliente}</span>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium capitalize
                ${selectedProject.estado === 'entregado' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' : 
                  selectedProject.estado === 'en_desarrollo' ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20' : 
                  'bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-500/20'}`}>
                {selectedProject.estado.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                <p className="text-xs font-medium text-zinc-500 mb-1">Tipo</p>
                <p className="text-sm text-zinc-900 capitalize">{selectedProject.tipo.replace(/_/g, ' ')}</p>
              </div>
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                <p className="text-xs font-medium text-zinc-500 mb-1">Prioridad</p>
                <p className="text-sm text-zinc-900 capitalize">{selectedProject.prioridad}</p>
              </div>
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                <p className="text-xs font-medium text-zinc-500 mb-1">Fecha Inicio</p>
                <p className="text-sm text-zinc-900">{formatDate(selectedProject.fecha_inicio)}</p>
              </div>
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                <p className="text-xs font-medium text-zinc-500 mb-1">Entrega Objetivo</p>
                <p className="text-sm text-zinc-900">{formatDate(selectedProject.fecha_entrega_objetivo)}</p>
              </div>
            </div>

            <div className="border-t border-zinc-200 pt-6">
              <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-500" />
                Historial de Actividad
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {projectHistory.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4">No hay actividad registrada.</p>
                ) : (
                  projectHistory.map(log => (
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

      <Modal 
        isOpen={isChecklistModalOpen} 
        onClose={() => setIsChecklistModalOpen(false)} 
        title={`Checklist: ${selectedProject?.nombre_proyecto || ''}`}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {sortedCategories.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">Cargando checklist...</div>
          ) : (
            sortedCategories.map(category => {
              const items = groupedChecklists[category];
              const completedCount = items.filter(i => i.is_completed === 1).length;
              const isExpanded = expandedCategories[category];
              
              return (
                <div key={category} className="border border-zinc-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between p-3 bg-zinc-50 hover:bg-zinc-100 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
                      <span className="font-medium text-sm text-zinc-900">{category}</span>
                    </div>
                    <span className="text-xs font-medium text-zinc-500 bg-white px-2 py-1 rounded-full border border-zinc-200">
                      {completedCount}/{items.length}
                    </span>
                  </button>
                  
                  {isExpanded && (
                    <div className="divide-y divide-zinc-100 bg-white">
                      {items.map(item => (
                        <label 
                          key={item.id} 
                          className="flex items-start gap-3 p-3 hover:bg-zinc-50 cursor-pointer transition-colors"
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            <input
                              type="checkbox"
                              checked={item.is_completed === 1}
                              onChange={() => toggleChecklistItem(item.id, item.is_completed)}
                              className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                            />
                          </div>
                          <span className={`text-sm ${item.is_completed === 1 ? 'text-zinc-400 line-through' : 'text-zinc-700'}`}>
                            {item.item}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Modal>
    </div>
  );
}
