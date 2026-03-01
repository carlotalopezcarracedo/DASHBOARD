import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth';
import { Plus, Download, Check, MoreVertical, Clock, FileText } from 'lucide-react';
import { formatDate, formatCurrency } from '../lib/utils';
import Modal from '../components/Modal';

export default function Billing() {
  const token = useAuthStore((state) => state.token);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoiceHistory, setInvoiceHistory] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    client_id: '',
    tipo: 'setup',
    total: '',
    fecha_vencimiento: ''
  });

  useEffect(() => {
    fetch('/api/invoices', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setInvoices(data));
      
    fetch('/api/clients', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setClients(data));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({
        ...formData,
        total: parseFloat(formData.total)
      })
    });
    
    if (res.ok) {
      const newInvoice = await res.json();
      setInvoices([newInvoice, ...invoices]);
      setIsModalOpen(false);
      setFormData({ client_id: '', tipo: 'setup', total: '', fecha_vencimiento: '' });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/invoices/${id}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ estado: newStatus })
    });
    
    if (res.ok) {
      setInvoices(invoices.map(inv => inv.id === id ? { ...inv, estado: newStatus } : inv));
      if (selectedInvoice && selectedInvoice.id === id) {
        setSelectedInvoice({ ...selectedInvoice, estado: newStatus });
        fetchInvoiceHistory(id);
      }
    }
  };

  const fetchInvoiceHistory = async (id: string) => {
    const res = await fetch(`/api/activity/invoice/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setInvoiceHistory(data);
    }
  };

  const openInvoiceDetails = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsDetailsModalOpen(true);
    fetchInvoiceHistory(invoice.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold tracking-tight">Facturación</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Crear Factura
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500">
              <tr>
                <th className="px-6 py-3 font-medium">Nº Factura</th>
                <th className="px-6 py-3 font-medium">Cliente</th>
                <th className="px-6 py-3 font-medium">Tipo</th>
                <th className="px-6 py-3 font-medium">Emisión</th>
                <th className="px-6 py-3 font-medium">Vencimiento</th>
                <th className="px-6 py-3 font-medium text-right">Total</th>
                <th className="px-6 py-3 font-medium text-center">Estado</th>
                <th className="px-6 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {invoices.map((invoice) => (
                <tr key={invoice.id} onClick={() => openInvoiceDetails(invoice)} className="hover:bg-zinc-50 transition-colors cursor-pointer">
                  <td className="px-6 py-4 font-mono text-zinc-900">{invoice.numero_factura}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-900">{invoice.nombre_cliente}</div>
                  </td>
                  <td className="px-6 py-4 text-zinc-600 capitalize">{invoice.tipo}</td>
                  <td className="px-6 py-4 text-zinc-500">{formatDate(invoice.fecha_emision)}</td>
                  <td className="px-6 py-4 text-zinc-500">{formatDate(invoice.fecha_vencimiento)}</td>
                  <td className="px-6 py-4 text-right font-medium text-zinc-900">{formatCurrency(invoice.total)}</td>
                  <td className="px-6 py-4 text-center">
                    <select
                      value={invoice.estado}
                      onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize border-0 focus:ring-2 focus:ring-zinc-900 cursor-pointer
                        ${invoice.estado === 'pagada' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' : 
                          invoice.estado === 'vencida' ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20' : 
                          'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20'}`}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="pagada">Pagada</option>
                      <option value="vencida">Vencida</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        title="Descargar PDF"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded bg-white border border-zinc-200 shadow-sm"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); openInvoiceDetails(invoice); }}
                        className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded bg-white border border-zinc-200 shadow-sm"
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
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Crear Factura">
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
                <option value="setup">Setup (Único)</option>
                <option value="mensualidad">Mensualidad</option>
                <option value="extra">Extra</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Total (EUR)</label>
              <input 
                type="number" required min="0" step="0.01"
                value={formData.total}
                onChange={e => setFormData({...formData, total: e.target.value})}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
              />
            </div>
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
            Emitir Factura
          </button>
        </form>
      </Modal>

      <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Detalles de la Factura">
        {selectedInvoice && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900 font-mono">{selectedInvoice.numero_factura}</h2>
                <div className="flex items-center gap-2 text-zinc-500 mt-1">
                  <FileText className="w-4 h-4" />
                  <span>{selectedInvoice.nombre_cliente}</span>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium capitalize
                ${selectedInvoice.estado === 'pagada' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' : 
                  selectedInvoice.estado === 'vencida' ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20' : 
                  'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20'}`}>
                {selectedInvoice.estado}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                <p className="text-xs font-medium text-zinc-500 mb-1">Tipo</p>
                <p className="text-sm text-zinc-900 capitalize">{selectedInvoice.tipo}</p>
              </div>
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                <p className="text-xs font-medium text-zinc-500 mb-1">Total</p>
                <p className="text-sm text-zinc-900 font-medium">{formatCurrency(selectedInvoice.total)}</p>
              </div>
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                <p className="text-xs font-medium text-zinc-500 mb-1">Fecha Emisión</p>
                <p className="text-sm text-zinc-900">{formatDate(selectedInvoice.fecha_emision)}</p>
              </div>
              <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                <p className="text-xs font-medium text-zinc-500 mb-1">Vencimiento</p>
                <p className="text-sm text-zinc-900">{formatDate(selectedInvoice.fecha_vencimiento)}</p>
              </div>
            </div>

            <div className="border-t border-zinc-200 pt-6">
              <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-500" />
                Historial de Actividad
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {invoiceHistory.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4">No hay actividad registrada.</p>
                ) : (
                  invoiceHistory.map(log => (
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
