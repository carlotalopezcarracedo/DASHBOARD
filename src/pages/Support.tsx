import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth';
import { Plus, MessageSquare, MoreVertical, Clock, User } from 'lucide-react';
import { formatDate } from '../lib/utils';
import Modal from '../components/Modal';

export default function Support() {
  const token = useAuthStore((state) => state.token);
  const [tickets, setTickets] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketHistory, setTicketHistory] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    client_id: '',
    titulo: '',
    descripcion: '',
    prioridad: 'media',
    tipo: 'pregunta'
  });

  useEffect(() => {
    fetch('/api/tickets', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setTickets(data));
      
    fetch('/api/clients', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setClients(data));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(formData)
    });
    
    if (res.ok) {
      const newTicket = await res.json();
      setTickets([newTicket, ...tickets]);
      setIsModalOpen(false);
      setFormData({ client_id: '', titulo: '', descripcion: '', prioridad: 'media', tipo: 'pregunta' });
    }
  };

  const toggleStatus = async (id: string, newStatus: string) => {
    await fetch(`/api/tickets/${id}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ estado: newStatus })
    });
    setTickets(tickets.map(t => t.id === id ? { ...t, estado: newStatus } : t));
    
    if (selectedTicket && selectedTicket.id === id) {
      setSelectedTicket({ ...selectedTicket, estado: newStatus });
      fetchTicketHistory(id);
    }
  };

  const fetchTicketHistory = async (id: string) => {
    const res = await fetch(`/api/activity/ticket/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setTicketHistory(data);
    }
  };

  const openTicketDetails = (ticket: any) => {
    setSelectedTicket(ticket);
    setIsDetailsModalOpen(true);
    fetchTicketHistory(ticket.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold tracking-tight">Soporte (Tickets)</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Ticket
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-zinc-100">
          {tickets.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">No hay tickets de soporte.</div>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} onClick={() => openTicketDetails(ticket)} className={`p-4 flex items-start justify-between hover:bg-zinc-50 transition-colors cursor-pointer ${ticket.estado === 'resuelto' ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <MessageSquare className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{ticket.titulo}</p>
                    <p className="text-xs text-zinc-500 mt-1">{ticket.nombre_cliente} • {formatDate(ticket.fecha_creacion)}</p>
                    {ticket.descripcion && (
                      <p className="text-sm text-zinc-600 mt-2 line-clamp-2">{ticket.descripcion}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-md capitalize ${
                      ticket.prioridad === 'alta' ? 'bg-red-50 text-red-700' : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      {ticket.prioridad}
                    </span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); openTicketDetails(ticket); }}
                      className="p-1 text-zinc-400 hover:text-zinc-900 rounded"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                  <select
                    value={ticket.estado}
                    onChange={(e) => toggleStatus(ticket.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize border-0 focus:ring-2 focus:ring-zinc-900 cursor-pointer
                      ${ticket.estado === 'resuelto' ? 'bg-emerald-50 text-emerald-700' : 
                        ticket.estado === 'en_progreso' ? 'bg-blue-50 text-blue-700' : 
                        'bg-zinc-100 text-zinc-700'}`}
                  >
                    <option value="nuevo">Nuevo</option>
                    <option value="en_progreso">En progreso</option>
                    <option value="resuelto">Resuelto</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Ticket">
        <form onSubmit={handleSubmit} className="space-y-4">
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
                <option key={c.id} value={c.id}>{c.nombre_cliente}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Asunto</label>
            <input 
              type="text" required
              value={formData.titulo}
              onChange={e => setFormData({...formData, titulo: e.target.value})}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Tipo</label>
              <select 
                value={formData.tipo}
                onChange={e => setFormData({...formData, tipo: e.target.value})}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
              >
                <option value="pregunta">Pregunta</option>
                <option value="bug">Incidencia / Bug</option>
                <option value="mejora">Mejora</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Prioridad</label>
              <select 
                value={formData.prioridad}
                onChange={e => setFormData({...formData, prioridad: e.target.value})}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Descripción</label>
            <textarea 
              rows={3}
              value={formData.descripcion}
              onChange={e => setFormData({...formData, descripcion: e.target.value})}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none resize-none"
            />
          </div>
          <button type="submit" className="w-full mt-4 bg-zinc-900 text-white py-2 rounded-lg font-medium hover:bg-zinc-800">
            Crear Ticket
          </button>
        </form>
      </Modal>

      <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Detalles del Ticket">
        {selectedTicket && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900">{selectedTicket.titulo}</h2>
                <div className="flex items-center gap-2 text-zinc-500 mt-1">
                  <User className="w-4 h-4" />
                  <span>{selectedTicket.nombre_cliente}</span>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium capitalize
                ${selectedTicket.estado === 'resuelto' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' : 
                  selectedTicket.estado === 'en_progreso' ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20' : 
                  'bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-500/20'}`}>
                {selectedTicket.estado.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                <p className="text-xs font-medium text-zinc-500 mb-1">Tipo</p>
                <p className="text-sm text-zinc-900 capitalize">{selectedTicket.tipo}</p>
              </div>
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                <p className="text-xs font-medium text-zinc-500 mb-1">Prioridad</p>
                <p className="text-sm text-zinc-900 capitalize">{selectedTicket.prioridad}</p>
              </div>
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                <p className="text-xs font-medium text-zinc-500 mb-1">Fecha Creación</p>
                <p className="text-sm text-zinc-900">{formatDate(selectedTicket.fecha_creacion)}</p>
              </div>
            </div>

            {selectedTicket.descripcion && (
              <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                <p className="text-sm text-zinc-700 whitespace-pre-wrap">{selectedTicket.descripcion}</p>
              </div>
            )}

            <div className="border-t border-zinc-200 pt-6">
              <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-500" />
                Historial de Actividad
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {ticketHistory.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4">No hay actividad registrada.</p>
                ) : (
                  ticketHistory.map(log => (
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
