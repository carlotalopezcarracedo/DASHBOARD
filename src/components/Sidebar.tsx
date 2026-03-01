import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  CheckSquare, 
  Receipt, 
  Calendar,
  LifeBuoy,
  Package,
  Settings,
  LogOut,
  Bot,
  X
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { cn } from '../lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Calendar, label: 'Calendario', path: '/calendar' },
  { icon: Users, label: 'Clientes', path: '/clients' },
  { icon: FolderKanban, label: 'Proyectos', path: '/projects' },
  { icon: CheckSquare, label: 'Tareas', path: '/tasks' },
  { icon: Receipt, label: 'Facturación', path: '/billing' },
  { icon: LifeBuoy, label: 'Soporte', path: '/tickets' },
  { icon: Package, label: 'Servicios', path: '/services' },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="w-full lg:w-64 bg-white border-r border-zinc-200 flex flex-col h-full">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
            <Bot className="text-white w-5 h-5" />
          </div>
          <span className="font-semibold text-lg tracking-tight">KARR.AI</span>
        </div>
        <button 
          onClick={onClose}
          className="lg:hidden p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-zinc-100 text-zinc-900" 
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-200 space-y-1">
        <NavLink 
          to="/settings"
          onClick={onClose}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left",
              isActive 
                ? "bg-zinc-100 text-zinc-900" 
                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
            )
          }
        >
          <Settings className="w-5 h-5" />
          Ajustes
        </NavLink>
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full text-left"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
