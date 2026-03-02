import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../store/auth';
import { User, Bell, Shield, Key, Save, RefreshCw, Copy, CheckCircle2 } from 'lucide-react';
import { formatDate } from '../lib/utils';

type TabId = 'profile' | 'notifications' | 'security' | 'api';

type NotificationPrefs = {
  emailTasks: boolean;
  emailTickets: boolean;
  pushMessages: boolean;
  weeklyDigest: boolean;
  updatedAt?: string;
};

type ApiKeyState = {
  hasKey: boolean;
  keyPreview?: string;
  createdAt?: string;
  apiKey?: string;
};

const initialNotifications: NotificationPrefs = {
  emailTasks: true,
  emailTickets: true,
  pushMessages: false,
  weeklyDigest: true,
};

export default function Settings() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [activeTab, setActiveTab] = useState<TabId>('profile');

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    role: '',
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  const [notifications, setNotifications] = useState<NotificationPrefs>(initialNotifications);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsSaving, setNotificationsSaving] = useState(false);
  const [notificationsMessage, setNotificationsMessage] = useState('');

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  const [apiKeyData, setApiKeyData] = useState<ApiKeyState>({ hasKey: false });
  const [apiKeyLoading, setApiKeyLoading] = useState(true);
  const [apiKeySaving, setApiKeySaving] = useState(false);
  const [apiKeyMessage, setApiKeyMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const tabs = useMemo(
    () => [
      { id: 'profile' as const, label: 'Perfil', icon: User },
      { id: 'notifications' as const, label: 'Notificaciones', icon: Bell },
      { id: 'security' as const, label: 'Seguridad', icon: Shield },
      { id: 'api' as const, label: 'API Keys', icon: Key },
    ],
    []
  );

  useEffect(() => {
    if (!token) return;

    loadProfile();
    loadNotifications();
    loadApiKey();
  }, [token]);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  const loadProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await fetch('/api/settings/profile', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo cargar el perfil');
      }

      setProfile({
        name: data.name || '',
        email: data.email || '',
        role: data.role || '',
      });
    } catch (error: any) {
      setProfileMessage(error.message || 'Error al cargar perfil');
    } finally {
      setProfileLoading(false);
    }
  };

  const loadNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const res = await fetch('/api/settings/notifications', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudieron cargar las notificaciones');
      }
      setNotifications(data);
    } catch (error: any) {
      setNotificationsMessage(error.message || 'Error al cargar notificaciones');
    } finally {
      setNotificationsLoading(false);
    }
  };

  const loadApiKey = async () => {
    setApiKeyLoading(true);
    try {
      const res = await fetch('/api/settings/api-key', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo cargar la API key');
      }
      setApiKeyData(data);
    } catch (error: any) {
      setApiKeyMessage(error.message || 'Error al cargar API key');
    } finally {
      setApiKeyLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setProfileMessage('');
    setProfileSaving(true);

    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo guardar el perfil');
      }

      updateUser(data);
      setProfile((current) => ({ ...current, role: data.role || current.role }));
      setProfileMessage('Perfil guardado correctamente.');
    } catch (error: any) {
      setProfileMessage(error.message || 'Error al guardar perfil');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setNotificationsMessage('');
    setNotificationsSaving(true);

    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(notifications),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudieron guardar las notificaciones');
      }

      setNotifications(data);
      setNotificationsMessage('Preferencias guardadas correctamente.');
    } catch (error: any) {
      setNotificationsMessage(error.message || 'Error al guardar notificaciones');
    } finally {
      setNotificationsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMessage('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordMessage('Completa todos los campos.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage('La confirmación de contraseña no coincide.');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch('/api/settings/password', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo actualizar la contraseña');
      }

      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordMessage('Contraseña actualizada correctamente.');
    } catch (error: any) {
      setPasswordMessage(error.message || 'Error al actualizar contraseña');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleRegenerateApiKey = async () => {
    setApiKeyMessage('');
    setApiKeySaving(true);
    setCopied(false);

    try {
      const res = await fetch('/api/settings/api-key/regenerate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo regenerar la API key');
      }

      setApiKeyData(data);
      setApiKeyMessage('API key regenerada. Copia la clave ahora, no se volverá a mostrar completa.');
    } catch (error: any) {
      setApiKeyMessage(error.message || 'Error al regenerar API key');
    } finally {
      setApiKeySaving(false);
    }
  };

  const handleCopyApiKey = async () => {
    if (!apiKeyData.apiKey) return;
    await navigator.clipboard.writeText(apiKeyData.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Ajustes</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
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

        <div className="flex-1 bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          {activeTab === 'profile' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-medium text-zinc-900">Información del perfil</h2>
              {profileLoading ? (
                <p className="text-sm text-zinc-500">Cargando perfil...</p>
              ) : (
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile((current) => ({ ...current, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile((current) => ({ ...current, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Rol</label>
                    <input
                      type="text"
                      value={profile.role || user?.role || 'admin'}
                      disabled
                      className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-zinc-50 text-zinc-500 cursor-not-allowed"
                    />
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={profileSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {profileSaving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                  {profileMessage && <p className="text-sm text-zinc-600">{profileMessage}</p>}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-medium text-zinc-900">Preferencias de notificaciones</h2>
              {notificationsLoading ? (
                <p className="text-sm text-zinc-500">Cargando notificaciones...</p>
              ) : (
                <div className="space-y-4">
                  {[
                    { id: 'emailTasks', label: 'Email: Nuevas tareas' },
                    { id: 'emailTickets', label: 'Email: Actualizaciones de soporte' },
                    { id: 'pushMessages', label: 'Push: Mensajes directos' },
                    { id: 'weeklyDigest', label: 'Resumen semanal' },
                  ].map((pref) => (
                    <div key={pref.id} className="flex items-center justify-between">
                      <span className="text-sm text-zinc-700">{pref.label}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={Boolean((notifications as any)[pref.id])}
                          onChange={(e) =>
                            setNotifications((current) => ({
                              ...current,
                              [pref.id]: e.target.checked,
                            }))
                          }
                        />
                        <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
                      </label>
                    </div>
                  ))}
                  <div className="pt-4">
                    <button
                      onClick={handleSaveNotifications}
                      disabled={notificationsSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {notificationsSaving ? 'Guardando...' : 'Guardar preferencias'}
                    </button>
                  </div>
                  {notifications.updatedAt && (
                    <p className="text-xs text-zinc-500">
                      Última actualización: {new Date(notifications.updatedAt).toLocaleString('es-ES')}
                    </p>
                  )}
                  {notificationsMessage && <p className="text-sm text-zinc-600">{notificationsMessage}</p>}
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-medium text-zinc-900">Seguridad de la cuenta</h2>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Contraseña actual</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm((current) => ({
                        ...current,
                        currentPassword: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Nueva contraseña</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((current) => ({
                        ...current,
                        newPassword: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Confirmar nueva contraseña</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((current) => ({
                        ...current,
                        confirmPassword: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>
                <div className="pt-4">
                  <button
                    onClick={handleChangePassword}
                    disabled={passwordSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {passwordSaving ? 'Actualizando...' : 'Actualizar contraseña'}
                  </button>
                </div>
                {passwordMessage && <p className="text-sm text-zinc-600">{passwordMessage}</p>}
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-medium text-zinc-900">API Keys</h2>
              <p className="text-sm text-zinc-500">
                Genera una clave para integraciones externas. Al regenerarla, la anterior deja de ser válida.
              </p>

              {apiKeyLoading ? (
                <p className="text-sm text-zinc-500">Cargando API key...</p>
              ) : (
                <div className="space-y-4">
                  <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                    {!apiKeyData.hasKey ? (
                      <p className="text-sm text-zinc-600">No hay ninguna API key activa.</p>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-zinc-900">{apiKeyData.keyPreview}</p>
                        {apiKeyData.createdAt && (
                          <p className="text-xs text-zinc-500">
                            Creada el {formatDate(apiKeyData.createdAt)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {apiKeyData.apiKey && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <p className="text-sm font-medium">Clave generada correctamente</p>
                      </div>
                      <div className="p-3 bg-white border border-emerald-200 rounded font-mono text-xs break-all">
                        {apiKeyData.apiKey}
                      </div>
                      <button
                        onClick={handleCopyApiKey}
                        className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md bg-emerald-700 text-white hover:bg-emerald-800 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        {copied ? 'Copiada' : 'Copiar clave'}
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleRegenerateApiKey}
                    disabled={apiKeySaving}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {apiKeySaving ? 'Regenerando...' : 'Regenerar API key'}
                  </button>

                  {apiKeyMessage && <p className="text-sm text-zinc-600">{apiKeyMessage}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
