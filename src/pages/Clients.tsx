import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth';
import { Search, Plus, MoreVertical, Building2, Clock, Pencil, Trash2 } from 'lucide-react';
import { formatDate } from '../lib/utils';
import Modal from '../components/Modal';

export default function Clients() {
  const token = useAuthStore((state) => state.token);
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientHistory, setClientHistory] = useState<any[]>([]);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre_cliente: '',
    nombre_negocio: '',
    sector: 'otro',
    estado_relacion: 'lead',
    prioridad: 'media'
  });

  const loadClients = async () => {
    const res = await fetch('/api/clients', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setClients(data);
    }
  };

  useEffect(() => {
    loadClients();
  }, [token]);

  const resetClientForm = () => {
    setFormData({
      nombre_cliente: '',
      nombre_negocio: '',
      sector: 'otro',
      estado_relacion: 'lead',
      prioridad: 'media'
    });
    setEditingClientId(null);
  };

  const openCreateClientModal = () => {
    resetClientForm();
    setIsModalOpen(true);
  };

  const openEditClientModal = (client: any) => {
    setEditingClientId(client.id);
    setFormData({
      nombre_cliente: client.nombre_cliente || '',
      nombre_negocio: client.nombre_negocio || '',
      sector: client.sector || 'otro',
      estado_relacion: client.estado_relacion || 'lead',
      prioridad: client.prioridad || 'media'
    });
    setIsDetailsModalOpen(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isEditing = !!editingClientId;
    const url = isEditing ? `/api/clients/${editingClientId}` : '/api/clients';
    const method = isEditing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    if (!res.ok) return;
    const savedClient = await res.json();

    if (isEditing) {
      setClients((prev) => prev.map((c) => (c.id === savedClient.id ? savedClient : c)));
      if (selectedClient && selectedClient.id === savedClient.id) {
        setSelectedClient(savedClient);
        fetchClientHistory(savedClient.id);
      }
    } else {
      setClients((prev) => [savedClient, ...prev]);
    }

    setIsModalOpen(false);
    resetClientForm();
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ estado_relacion: newStatus })
    });

    if (res.ok) {
      const updatedClient = await res.json();
      setClients((prev) => prev.map((c) => (c.id === id ? updatedClient : c)));
      if (selectedClient && selectedClient.id === id) {
        setSelectedClient(updatedClient);
        fetchClientHistory(id);
      }
    }
  };

  const fetchClientHistory = async (id: string) => {
    const res = await fetch(`/api/activity/client/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setClientHistory(data);
    }
  };

  const openClientDetails = (client: any) => {
    setSelectedClient(client);
    setIsDetailsModalOpen(true);
    fetchClientHistory(client.id);
  };

  const handleDeleteClient = async (client: any) => {
    const confirmed = window.confirm(`¿Seguro que quieres eliminar a "${client.nombre_cliente}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    const res = await fetch(`/api/clients/${client.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) return;

    setClients((prev) => prev.filter((c) => c.id !== client.id));
    if (selectedClient && selectedClient.id === client.id) {
      setSelectedClient(null);
      setIsDetailsModalOpen(false);
      setClientHistory([]);
    }
  };

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.nombre_cliente.toLowerCase().includes(search.toLowerCase()) ||
      c.nombre_negocio?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === '' || c.estado_relacion === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
        <button
          onClick={openCreateClientModal}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="lead">Lead</option>
            <option value="negociacion">Negociación</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500">
              <tr>
                <th className="px-6 py-3 font-medium">Cliente / Negocio</th>
                <th className="px-6 py-3 font-medium">Sector</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium">Prioridad</th>
                <th className="px-6 py-3 font-medium">Fecha Alta</th>
                <th className="px-6 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredClients.map((client) => (
                <tr key={client.id} onClick={() => openClientDetails(client)} className="hover:bg-zinc-50 transition-colors cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-900">{client.nombre_cliente}</div>
                    <div className="text-zinc-500 text-xs mt-0.5">{client.nombre_negocio}</div>
                  </td>
                  <td className="px-6 py-4 text-zinc-600 capitalize">{client.sector}</td>
                  <td className="px-6 py-4">
                    <select
                      value={client.estado_relacion}
                      onChange={(e) => handleStatusChange(client.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize border-0 focus:ring-2 focus:ring-zinc-900 cursor-pointer
                        ${
                          client.estado_relacion === 'activo'
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                            : client.estado_relacion === 'lead'
                              ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20'
                              : 'bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-500/20'
                        }`}
                    >
                      <option value="lead">Lead</option>
                      <option value="contacto">Contacto</option>
                      <option value="negociacion">Negociación</option>
                      <option value="activo">Activo</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize
                      ${
                        client.prioridad === 'alta'
                          ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
                          : client.prioridad === 'media'
                            ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20'
                            : 'bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-500/20'
                      }`}
                    >
                      {client.prioridad}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-500">{formatDate(client.fecha_alta)}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openClientDetails(client);
                      }}
                      className="p-1 text-zinc-400 hover:text-zinc-900 rounded"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingClientId ? 'Editar Cliente' : 'Nuevo Cliente'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre del Cliente</label>
            <input
              type="text"
              required
              value={formData.nombre_cliente}
              onChange={(e) => setFormData({ ...formData, nombre_cliente: e.target.value })}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Negocio / Empresa</label>
            <input
              type="text"
              required
              value={formData.nombre_negocio}
              onChange={(e) => setFormData({ ...formData, nombre_negocio: e.target.value })}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Sector</label>
              <select
                value={formData.sector}
                onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
              >
                <option value="peluquería">Peluquería</option>
                <option value="estética">Estética</option>
                <option value="clínica">Clínica</option>
                <option value="fisio">Fisio</option>
                <option value="masajes">Masajes</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Estado</label>
              <select
                value={formData.estado_relacion}
                onChange={(e) => setFormData({ ...formData, estado_relacion: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
              >
                <option value="lead">Lead</option>
                <option value="contacto">Contacto</option>
                <option value="negociacion">Negociación</option>
                <option value="activo">Activo</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Prioridad</label>
            <select
              value={formData.prioridad}
              onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
            >
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
          <button type="submit" className="w-full mt-4 bg-zinc-900 text-white py-2 rounded-lg font-medium hover:bg-zinc-800">
            {editingClientId ? 'Guardar Cambios' : 'Guardar Cliente'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Detalles del Cliente">
        {selectedClient && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900">{selectedClient.nombre_cliente}</h2>
                <div className="flex items-center gap-2 text-zinc-500 mt-1">
                  <Building2 className="w-4 h-4" />
                  <span>{selectedClient.nombre_negocio}</span>
                </div>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium capitalize
                ${
                  selectedClient.estado_relacion === 'activo'
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                    : selectedClient.estado_relacion === 'lead'
                      ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20'
                      : 'bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-500/20'
                }`}
              >
                {selectedClient.estado_relacion}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                <p className="text-xs font-medium text-zinc-500 mb-1">Sector</p>
                <p className="text-sm text-zinc-900 capitalize">{selectedClient.sector}</p>
              </div>
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                <p className="text-xs font-medium text-zinc-500 mb-1">Prioridad</p>
                <p className="text-sm text-zinc-900 capitalize">{selectedClient.prioridad}</p>
              </div>
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                <p className="text-xs font-medium text-zinc-500 mb-1">Fecha Alta</p>
                <p className="text-sm text-zinc-900">{formatDate(selectedClient.fecha_alta)}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => openEditClientModal(selectedClient)}
                className="flex items-center justify-center gap-2 flex-1 px-3 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={() => handleDeleteClient(selectedClient)}
                className="flex items-center justify-center gap-2 flex-1 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm font-medium border border-red-200 hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>

            <div className="border-t border-zinc-200 pt-6">
              <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-500" />
                Historial de Actividad
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {clientHistory.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4">No hay actividad registrada.</p>
                ) : (
                  clientHistory.map((log) => (
                    <div key={log.id} className="bg-white p-3 rounded-lg border border-zinc-200 text-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-zinc-900">{log.detalle}</span>
                        <span className="text-xs text-zinc-400 whitespace-nowrap ml-2">
                          {new Date(log.fecha).toLocaleDateString('es-ES', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
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
