import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Users, Package, LogOut, FileText } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { name: 'Frente de Caixa', icon: <ShoppingCart size={20} />, path: '/pos' },
    { name: 'Produtos', icon: <Package size={20} />, path: '/products' },
    { name: 'Clientes', icon: <Users size={20} />, path: '/customers' },
    { name: 'Relatórios', icon: <FileText size={20} />, path: '/reports' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans print:h-auto print:bg-white">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex print:hidden">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 shadow-sm">
            <span className="text-white font-bold">M</span>
          </div>
          <span className="font-bold text-lg tracking-tight">MEI Gestão</span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <div className={`${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                  {item.icon}
                </div>
                {item.name}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible">
        {/* Mobile Header (Only visible on small screens) */}
        <header className="md:hidden bg-white h-16 border-b border-gray-200 flex items-center justify-between px-4 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">M</span>
            </div>
            <span className="font-bold">MEI Gestão</span>
          </div>
          <button onClick={handleLogout} className="p-2 text-red-600">
            <LogOut size={20} />
          </button>
        </header>

        {/* Scrollable page area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 print:p-0 print:overflow-visible">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
