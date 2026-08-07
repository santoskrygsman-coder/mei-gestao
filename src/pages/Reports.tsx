import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Filter, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Sale {
  id: string;
  total: number;
  paymentMethod: string;
  createdAt: string;
  customer?: {
    name: string;
  };
  items: Array<{
    quantity: number;
    unitPrice: number;
    product: {
      name: string;
    }
  }>;
}

export default function Reports() {
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        // Simulando que a API de transações já retorna o histórico.
        // Vamos criar um endpoint rápido no backend ou buscar direto das vendas.
        // Se a API não existir ainda, precisaremos cria-la.
        const response = await fetch(`${apiUrl}/api/sales`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setSales(data);
        } else {
          console.error("Erro ao carregar relatórios");
        }
      } catch (error) {
        console.error('Erro de conexão:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [navigate]);

  const paymentMethodMap: Record<string, string> = {
    'CASH': 'Dinheiro',
    'PIX': 'PIX',
    'CREDIT': 'Crédito',
    'DEBIT': 'Débito'
  };

  const filteredSales = sales.filter(s => {
    // Basic search by ID or Customer Name
    const matchesSearch = s.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (s.customer?.name || 'Consumidor Final').toLowerCase().includes(searchTerm.toLowerCase());
    
    // Basic month filter
    let matchesMonth = true;
    if (filterMonth !== 'all') {
      const saleMonth = new Date(s.createdAt).getMonth().toString();
      matchesMonth = saleMonth === filterMonth;
    }

    return matchesSearch && matchesMonth;
  });

  const totalSalesValue = filteredSales.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="text-gray-900 font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Relatórios de Vendas</h1>
            <p className="text-gray-500 mt-1">Histórico detalhado de todas as transações realizadas no PDV.</p>
          </div>
          <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm">
            <Download size={20} />
            Exportar CSV
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
          {/* Toolbar */}
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
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Filter className="text-gray-400" size={20} />
              <select 
                className="w-full md:w-48 p-2.5 bg-white border border-gray-200 rounded-lg outline-none shadow-sm"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              >
                <option value="all">Todos os Meses</option>
                <option value={new Date().getMonth().toString()}>Mês Atual</option>
                <option value={(new Date().getMonth() - 1).toString()}>Mês Anterior</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FileText size={48} className="mb-4 text-gray-200" />
                <p>Nenhuma venda encontrada para os filtros selecionados.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-white sticky top-0 border-b border-gray-200 shadow-sm z-10">
                  <tr>
                    <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Data</th>
                    <th className="py-4 px-6 font-semibold text-gray-600 text-sm">ID Venda</th>
                    <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Cliente</th>
                    <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Itens</th>
                    <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Pagamento</th>
                    <th className="py-4 px-6 font-semibold text-gray-600 text-sm text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {format(parseISO(sale.createdAt), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                      </td>
                      <td className="py-4 px-6 text-sm font-mono text-gray-500">
                        #{sale.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-900">
                        {sale.customer?.name || <span className="text-gray-400 italic">Consumidor Final</span>}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {sale.items.reduce((acc, curr) => acc + curr.quantity, 0)} itens
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                          {paymentMethodMap[sale.paymentMethod] || sale.paymentMethod}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm font-bold text-gray-900 text-right">
                        R$ {sale.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Footer Summary */}
          <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-between items-center">
            <span className="text-gray-600 font-medium">{filteredSales.length} vendas listadas</span>
            <div className="text-lg">
              <span className="text-gray-500 mr-2">Total Filtrado:</span>
              <span className="font-bold text-green-600">R$ {totalSalesValue.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
