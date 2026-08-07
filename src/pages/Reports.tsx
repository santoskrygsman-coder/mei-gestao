import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Filter, Search, TrendingUp, Users, DollarSign, Package } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Sale {
  id: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
  customer?: { name: string; };
  items: Array<{ quantity: number; unitPrice: number; product: { name: string; } }>;
}

export default function Reports() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'sales' | 'products' | 'customers' | 'financial'>('sales');
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [sales, setSales] = useState<Sale[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [financial, setFinancial] = useState<any>(null);

  const [searchTerm, setSearchTerm] = useState('');
  
  // Date Filters
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(format(firstDay, 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(today, 'yyyy-MM-dd'));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const queryParams = `?startDate=${startDate}T00:00:00.000Z&endDate=${endDate}T23:59:59.999Z`;
        
        if (activeTab === 'sales') {
          const response = await fetch(`${apiUrl}/api/sales${queryParams}`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (response.ok) setSales(await response.json());
        } else if (activeTab === 'products') {
          const response = await fetch(`${apiUrl}/api/reports/top-products${queryParams}`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (response.ok) setTopProducts(await response.json());
        } else if (activeTab === 'customers') {
          const response = await fetch(`${apiUrl}/api/reports/top-customers${queryParams}`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (response.ok) setTopCustomers(await response.json());
        } else if (activeTab === 'financial') {
          const response = await fetch(`${apiUrl}/api/reports/financial${queryParams}`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (response.ok) setFinancial(await response.json());
        }
      } catch (error) {
        console.error('Erro de conexão:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, activeTab, startDate, endDate]);

  const paymentMethodMap: Record<string, string> = {
    'CASH': 'Dinheiro', 'PIX': 'PIX', 'CREDIT': 'Crédito', 'DEBIT': 'Débito'
  };

  const filteredSales = sales.filter(s => {
    const matchesSearch = s.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.customer?.name || 'Consumidor Final').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalSalesValue = filteredSales.reduce((acc, curr) => acc + curr.total, 0);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'sales':
        return (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text"
                  placeholder="Buscar por cliente ou ID da venda..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-auto">
              {filteredSales.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                  <FileText size={48} className="mb-4 text-gray-200" />
                  <p>Nenhuma venda encontrada.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white sticky top-0 border-b border-gray-200 shadow-sm z-10">
                    <tr>
                      <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Data</th>
                      <th className="py-4 px-6 font-semibold text-gray-600 text-sm">ID Venda</th>
                      <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Cliente</th>
                      <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Pagamento</th>
                      <th className="py-4 px-6 font-semibold text-gray-600 text-sm text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((sale) => (
                      <tr key={sale.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-4 px-6 text-sm text-gray-600">{format(parseISO(sale.createdAt), "dd MMM, HH:mm")}</td>
                        <td className="py-4 px-6 text-sm font-mono text-gray-500">#{sale.id.slice(0, 8).toUpperCase()}</td>
                        <td className="py-4 px-6 text-sm font-medium">{sale.customer?.name || <span className="text-gray-400 italic">Consumidor Final</span>}</td>
                        <td className="py-4 px-6 text-sm">
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                            {paymentMethodMap[sale.paymentMethod] || sale.paymentMethod}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm font-bold text-right text-gray-900">R$ {sale.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-between items-center">
              <span className="text-gray-600 font-medium">{filteredSales.length} vendas</span>
              <div className="text-lg">
                <span className="text-gray-500 mr-2">Total:</span>
                <span className="font-bold text-green-600">R$ {totalSalesValue.toFixed(2)}</span>
              </div>
            </div>
          </div>
        );

      case 'products':
        return (
          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Produtos Mais Vendidos</h3>
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-6 font-semibold text-gray-600 text-sm">Produto</th>
                    <th className="py-3 px-6 font-semibold text-gray-600 text-sm text-center">Unidades Vendidas</th>
                    <th className="py-3 px-6 font-semibold text-gray-600 text-sm text-right">Receita Total</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((tp, idx) => (
                    <tr key={tp.product.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-4 px-6 flex items-center gap-3">
                        <span className="font-bold text-gray-400 w-6">{idx + 1}º</span>
                        <div className="font-medium text-gray-900">{tp.product.name}</div>
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-blue-600">{tp.quantity}</td>
                      <td className="py-4 px-6 text-right font-bold text-green-600">R$ {tp.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                  {topProducts.length === 0 && (
                    <tr><td colSpan={3} className="py-8 text-center text-gray-500">Nenhum dado disponível.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'customers':
        return (
          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Melhores Clientes</h3>
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-6 font-semibold text-gray-600 text-sm">Cliente</th>
                    <th className="py-3 px-6 font-semibold text-gray-600 text-sm text-center">Compras Feitas</th>
                    <th className="py-3 px-6 font-semibold text-gray-600 text-sm text-right">Total Gasto</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map((tc, idx) => (
                    <tr key={tc.customer.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-4 px-6 flex items-center gap-3">
                        <span className="font-bold text-yellow-500 w-6">{idx === 0 ? '👑' : `${idx + 1}º`}</span>
                        <div className="font-medium text-gray-900">{tc.customer.name}</div>
                      </td>
                      <td className="py-4 px-6 text-center text-gray-600">{tc.totalPurchases}</td>
                      <td className="py-4 px-6 text-right font-bold text-green-600">R$ {tc.totalSpent.toFixed(2)}</td>
                    </tr>
                  ))}
                  {topCustomers.length === 0 && (
                    <tr><td colSpan={3} className="py-8 text-center text-gray-500">Nenhum dado disponível.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'financial':
        if (!financial) return null;
        return (
          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Resumo Financeiro (Geral)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-gray-500 text-sm font-medium mb-1">Total de Entradas</p>
                <p className="text-3xl font-black text-green-600">R$ {financial.totalIncome.toFixed(2)}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-gray-500 text-sm font-medium mb-1">Total de Saídas (Despesas)</p>
                <p className="text-3xl font-black text-red-600">R$ {financial.totalExpense.toFixed(2)}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm bg-gradient-to-br from-blue-50 to-white">
                <p className="text-gray-500 text-sm font-medium mb-1">Saldo Líquido</p>
                <p className={`text-3xl font-black ${financial.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  R$ {financial.balance.toFixed(2)}
                </p>
              </div>
            </div>

            <h4 className="font-bold text-gray-900 mb-4">Despesas por Categoria</h4>
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-6 font-semibold text-gray-600 text-sm">Categoria</th>
                    <th className="py-3 px-6 font-semibold text-gray-600 text-sm text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {financial.expensesByCategory.map((exp: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-4 px-6 font-medium text-gray-700">{exp.name}</td>
                      <td className="py-4 px-6 text-right font-bold text-red-500">- R$ {exp.value.toFixed(2)}</td>
                    </tr>
                  ))}
                  {financial.expensesByCategory.length === 0 && (
                    <tr><td colSpan={2} className="py-8 text-center text-gray-500">Nenhuma despesa registrada.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
    }
  };

  const tabs = [
    { id: 'sales', name: 'Histórico de Vendas', icon: FileText },
    { id: 'products', name: 'Mais Vendidos', icon: Package },
    { id: 'customers', name: 'Melhores Clientes', icon: Users },
    { id: 'financial', name: 'Financeiro', icon: DollarSign },
  ];

  return (
    <div className="h-full flex flex-col md:flex-row gap-6">
      
      {/* Menu Lateral de Relatórios */}
      <div className="w-full md:w-64 flex flex-col shrink-0">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 px-2">Central de Relatórios</h2>
        <div className="flex flex-row md:flex-col gap-2 overflow-x-auto custom-scrollbar pb-2 md:pb-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-left whitespace-nowrap ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                    : 'bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-600 border border-transparent'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-blue-100' : 'text-gray-400'} />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo do Relatório */}
      <div className="flex-1 flex flex-col">
        {/* Date Filter Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 text-gray-700">
            <Filter size={20} className="text-blue-600" />
            <span className="font-bold">Filtrar por Período</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input 
              type="date"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-auto"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-gray-400">até</span>
            <input 
              type="date"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-auto"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[500px]">
          {renderContent()}
        </div>
      </div>
      
    </div>
  );
}
