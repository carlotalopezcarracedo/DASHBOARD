import React, { useState } from 'react';
import { useAuthStore } from '../store/auth';
import { User, Bell, Shield, Key, Save } from 'lucide-react';

export default function Settings() {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'api', label: 'API Keys', icon: Key },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Ajustes</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar for settings */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content area */}
        <div className="flex-1 bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          {activeTab === 'profile' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-medium text-zinc-900">Información del Perfil</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    defaultValue={user?.name || 'Usuario'}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
                  <input
                    type="email"
                    defaultValue={user?.email || 'usuario@ejemplo.com'}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Rol</label>
                  <input
                    type="text"
                    defaultValue={user?.role || 'Administrador'}
                    disabled
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-zinc-50 text-zinc-500 cursor-not-allowed"
                  />
                </div>
                <div className="pt-4">
                  <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors">
                    <Save className="w-4 h-4" />
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-medium text-zinc-900">Preferencias de Notificaciones</h2>
              <div className="space-y-4">
                {[
                  { id: 'email_tasks', label: 'Email: Nuevas Tareas', defaultChecked: true },
                  { id: 'email_tickets', label: 'Email: Actualizaciones de Soporte', defaultChecked: true },
                  { id: 'push_messages', label: 'Push: Mensajes Directos', defaultChecked: false },
                  { id: 'weekly_digest', label: 'Resumen Semanal', defaultChecked: true },
                ].map((pref) => (
                  <div key={pref.id} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-700">{pref.label}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={pref.defaultChecked} />
                      <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-medium text-zinc-900">Seguridad de la Cuenta</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Contraseña Actual</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Nueva Contraseña</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Confirmar Nueva Contraseña</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>
                <div className="pt-4">
                  <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors">
                    <Save className="w-4 h-4" />
                    Actualizar Contraseña
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-medium text-zinc-900">API Keys</h2>
              <p className="text-sm text-zinc-500">Gestiona las claves de API para integraciones externas.</p>
              <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-900">Clave Principal</p>
                  <p className="text-xs text-zinc-500 font-mono mt-1">sk_live_**********************</p>
                </div>
                <button className="text-sm font-medium text-zinc-900 hover:text-zinc-700">
                  Regenerar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
