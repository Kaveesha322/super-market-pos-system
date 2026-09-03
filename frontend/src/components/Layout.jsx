import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, BarChart3, Users, Settings,
  Truck, Warehouse, LogOut, Store, ChevronRight, Bell, User
} from 'lucide-react';
import { useAuthStore } from '../store';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'manager', 'cashier'] },
  { to: '/pos', icon: ShoppingCart, label: 'POS / Cashier', roles: ['admin', 'manager', 'cashier'] },
  { to: '/products', icon: Package, label: 'Products', roles: ['admin', 'manager'] },
  { to: '/stock', icon: Warehouse, label: 'Stock', roles: ['admin', 'manager'] },
  { to: '/suppliers', icon: Truck, label: 'Suppliers', roles: ['admin', 'manager'] },
  { to: '/reports', icon: BarChart3, label: 'Reports', roles: ['admin', 'manager'] },
  { to: '/users', icon: Users, label: 'Users', roles: ['admin'] },
  { to: '/settings', icon: Settings, label: 'Settings', roles: ['admin'] },
];

export default function Layout() {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleNav = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} bg-slate-900 text-white flex flex-col transition-all duration-300 flex-shrink-0`}>
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-700">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Store size={18} />
          </div>
          {sidebarOpen && (
            <div>
              <div className="font-bold text-sm leading-tight">Super Lanka Mart</div>
              <div className="text-xs text-slate-400">POS System</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {visibleNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-green-600 text-white font-medium'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="p-2 border-t border-slate-700">
          {sidebarOpen && (
            <div className="flex items-center gap-2 px-3 py-2 mb-1">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <div className="text-sm font-medium truncate">{user?.name}</div>
                <div className="text-xs text-slate-400 capitalize">{user?.role}</div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-red-600 hover:text-white transition-all"
          >
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <ChevronRight size={20} className={`transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-500">
              {new Date().toLocaleDateString('en-LK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div className="w-px h-5 bg-slate-200" />
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <User size={16} />
              {user?.name}
              <span className="badge bg-green-100 text-green-700 capitalize">{user?.role}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
