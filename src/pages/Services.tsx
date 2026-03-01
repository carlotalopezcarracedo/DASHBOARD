import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth';
import { Plus, Package } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import Modal from '../components/Modal';

export default function Services() {
  const token = useAuthStore((state) => state.token);
  const [services, setServices] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre_servicio: '',
    tipo_precio: 'implementacion_unica',
    precio_setup: '',
    precio_mensual: '',
    descripcion: ''
  });

  useEffect(() => {
    fetch('/api/services', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setServices(data));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/services', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({
        ...formData,
        precio_setup: parseFloat(formData.precio_setup || '0'),
        precio_mensual: parseFloat(formData.precio_mensual || '0')
      })
    });
    
    if (res.ok) {
      const newService = await res.json();
      setServices([...services, newService]);
      setIsModalOpen(false);
      setFormData({ nombre_servicio: '', tipo_precio: 'implementacion_unica', precio_setup: '', precio_mensual: '', descripcion: '' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold tracking-tight">Catálogo de Servicios</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Servicio
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.length === 0 ? (
          <div className="col-span-full p-8 text-center text-zinc-500 bg-white rounded-2xl border border-zinc-200">
            No hay servicios en el catálogo.
          </div>
        ) : (
          services.map((service) => (
            <div key={service.id} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-zinc-600" />
                </div>
                <h3 className="font-semibold text-zinc-900">{service.nombre_servicio}</h3>
              </div>
              <p className="text-sm text-zinc-500 mb-6 flex-1">{service.descripcion}</p>
              <div className="pt-4 border-t border-zinc-100 flex justify-between items-end">
                <div>
                  <p className="text-xs text-zinc-500 mb-1 capitalize">{service.tipo_precio.replace('_', ' ')}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-semibold text-zinc-900">
                      {formatCurrency(service.precio_setup || service.precio_mensual)}
                    </span>
                    {service.precio_mensual > 0 && service.precio_setup > 0 && (
                      <span className="text-xs text-zinc-500">+ {formatCurrency(service.precio_mensual)}/mes</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Servicio">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre del Servicio</label>
            <input 
              type="text" required
              value={formData.nombre_servicio}
              onChange={e => setFormData({...formData, nombre_servicio: e.target.value})}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Tipo de Precio</label>
            <select 
              value={formData.tipo_precio}
              onChange={e => setFormData({...formData, tipo_precio: e.target.value})}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
            >
              <option value="implementacion_unica">Implementación Única</option>
              <option value="cuota_mensual">Cuota Mensual</option>
              <option value="ambos">Ambos (Setup + Mensual)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Precio Setup</label>
              <input 
                type="number" min="0" step="0.01"
                value={formData.precio_setup}
                onChange={e => setFormData({...formData, precio_setup: e.target.value})}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Precio Mensual</label>
              <input 
                type="number" min="0" step="0.01"
                value={formData.precio_mensual}
                onChange={e => setFormData({...formData, precio_mensual: e.target.value})}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                placeholder="0.00"
              />
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
            Guardar Servicio
          </button>
        </form>
      </Modal>
    </div>
  );
}
