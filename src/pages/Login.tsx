import React, { useState } from 'react';
import { useAuthStore } from '../store/auth';
import { useNavigate } from 'react-router-dom';
import { Bot } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('admin@karr.ai');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        navigate('/');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Error de conexión');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-sm border border-zinc-200">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center mb-4">
            <Bot className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold text-zinc-900">KARR.AI</h1>
          <p className="text-zinc-500 text-sm mt-1">Panel de Gestión</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-zinc-900 text-white py-2 rounded-lg hover:bg-zinc-800 transition-colors font-medium"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
