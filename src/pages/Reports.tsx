import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Filter, Search, TrendingUp, Users, DollarSign, Package, Printer, MessageCircle, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TableSkeleton } from '../components/Skeleton';

interface Sale {
  id: string;
  saleNumber: number;
  total: number;
  paymentMethod: string;
  createdAt: string;
  installments?: number;
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
  
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false);
  
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
    'CASH': 'Dinheiro', 'PIX': 'PIX', 'CREDIT': 'Crédito', 'DEBIT': 'Débito', 'PENDING': 'Condicional', 'CREDIARIO': 'Crediário'
  };

  const paymentColorMap: Record<string, string> = {
    'CASH': 'bg-green-100 text-green-700', 
    'PIX': 'bg-purple-100 text-purple-700', 
    'CREDIT': 'bg-blue-100 text-blue-700', 
    'DEBIT': 'bg-indigo-100 text-indigo-700',
    'PENDING': 'bg-orange-100 text-orange-700',
    'CREDIARIO': 'bg-yellow-100 text-yellow-700'
  };

  const filteredSales = sales.filter(s => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = String(s.saleNumber).includes(searchLower) || 
                          (s.customer?.name || 'Consumidor Final').toLowerCase().includes(searchLower) ||
                          s.id.toLowerCase().includes(searchLower);
    return matchesSearch;
  });

  const totalSalesValue = filteredSales.reduce((acc, curr) => acc + curr.total, 0);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="animate-in fade-in duration-300">
          <TableSkeleton rows={8} columns={4} />
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
                  placeholder="Buscar por cliente ou número da venda..."
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
                      <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Nº Venda</th>
                      <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Cliente</th>
                      <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Pagamento</th>
                      <th className="py-4 px-6 font-semibold text-gray-600 text-sm text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((sale) => (
                      <tr 
                        key={sale.id} 
                        className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedSale(sale)}
                      >
                        <td className="py-4 px-6 text-sm text-gray-600">{format(parseISO(sale.createdAt), "dd MMM, HH:mm")}</td>
                        <td className="py-4 px-6 text-sm font-mono text-gray-500">#{String(sale.saleNumber).padStart(4, '0')}</td>
                        <td className="py-4 px-6 text-sm font-medium">{sale.customer?.name || <span className="text-gray-400 italic">Consumidor Final</span>}</td>
                        <td className="py-4 px-6 text-sm">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${paymentColorMap[sale.paymentMethod] || 'bg-gray-100 text-gray-700'}`}>
                            {paymentMethodMap[sale.paymentMethod] || sale.paymentMethod}
                            {(sale.paymentMethod === 'CREDIT' || sale.paymentMethod === 'CREDIARIO') && sale.installments && sale.installments > 1 ? ` (${sale.installments}x)` : ''}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
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
              
              <div>
                <h4 className="font-bold text-gray-900 mb-4">Faturamento por Pagamento</h4>
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="py-3 px-6 font-semibold text-gray-600 text-sm">Método</th>
                        <th className="py-3 px-6 font-semibold text-gray-600 text-sm text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financial.incomeByMethod?.map((inc: any, idx: number) => (
                        <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-4 px-6 font-medium text-gray-700">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${paymentColorMap[inc.method] || 'bg-gray-100 text-gray-700'}`}>
                              {paymentMethodMap[inc.method] || inc.method}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right font-bold text-green-600">R$ {inc.value.toFixed(2)}</td>
                        </tr>
                      ))}
                      {(!financial.incomeByMethod || financial.incomeByMethod.length === 0) && (
                        <tr><td colSpan={2} className="py-8 text-center text-gray-500">Nenhum faturamento registrado.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
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
      <div className="w-full md:w-64 flex flex-col shrink-0 print:hidden">
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
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between print:hidden">
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
            <button 
              onClick={() => window.print()}
              className="ml-2 flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors shadow-sm"
            >
              <Printer size={18} /> Imprimir
            </button>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[500px]">
          {renderContent()}
        </div>
      </div>
      
      {/* Modal de Detalhes da Venda */}
      {selectedSale && !isPrintingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <FileText size={20} className="text-blue-600" /> Detalhes da Venda #{String(selectedSale.saleNumber).padStart(4, '0')}
              </h3>
              <button onClick={() => setSelectedSale(null)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Cliente</p>
                  <p className="font-bold text-gray-900">{selectedSale.customer?.name || 'Consumidor Final'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Data</p>
                  <p className="font-bold text-gray-900">{format(parseISO(selectedSale.createdAt), "dd/MM/yyyy HH:mm")}</p>
                </div>
              </div>
              
              <h4 className="font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">Itens Comprados</h4>
              <div className="space-y-3 mb-6">
                {selectedSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <div className="flex gap-3 items-center">
                      <span className="font-bold text-gray-500 text-sm">{item.quantity}x</span>
                      <span className="font-medium text-gray-900">{item.product.name}</span>
                    </div>
                    <span className="font-bold text-gray-600">R$ {(item.unitPrice * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center border-t border-gray-100 pt-4 mb-2">
                <span className="text-gray-500 font-medium">Pagamento</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${paymentColorMap[selectedSale.paymentMethod] || 'bg-gray-100 text-gray-700'}`}>
                  {paymentMethodMap[selectedSale.paymentMethod] || selectedSale.paymentMethod}
                  {(selectedSale.paymentMethod === 'CREDIT' || selectedSale.paymentMethod === 'CREDIARIO') && selectedSale.installments && selectedSale.installments > 1 ? ` (${selectedSale.installments}x)` : ''}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium text-lg">Total</span>
                <span className="text-2xl font-black text-gray-900">R$ {selectedSale.total.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button 
                onClick={() => {
                  let text = `*COMPROVANTE DE VENDA*\n========================\n*Ticket:* #${String(selectedSale.saleNumber).padStart(4, '0')}\n*Data:* ${format(parseISO(selectedSale.createdAt), "dd/MM/yyyy HH:mm")}\n\n*ITENS:*\n`;
                  selectedSale.items.forEach(i => { text += `- ${i.quantity}x ${i.product.name}\n`; });
                  text += `\n*TOTAL: R$ ${selectedSale.total.toFixed(2)}*\n*Pagamento:* ${paymentMethodMap[selectedSale.paymentMethod]}\n\n*Obrigado!*`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-sm"
              >
                <MessageCircle size={20} /> WhatsApp
              </button>
              <button 
                onClick={() => {
                  setIsPrintingReceipt(true);
                  setTimeout(() => { window.print(); setIsPrintingReceipt(false); }, 100);
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-sm"
              >
                <Printer size={20} /> Recibo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recibo 80mm para Reimpressão (Oculto exceto no print) */}
      {isPrintingReceipt && selectedSale && (
        <>
          <style>{`
            @media print {
              @page { margin: 0; size: 80mm auto; }
              body * { visibility: hidden; }
              #printable-receipt, #printable-receipt * { visibility: visible; }
              #printable-receipt { position: absolute; left: 0; top: 0; width: 80mm !important; padding: 2mm !important; margin: 0 !important; }
            }
          `}</style>
          <div className="hidden print:block w-[80mm] bg-white text-black font-mono text-sm p-2" id="printable-receipt">
            <div className="text-center font-bold text-lg mb-1">COMPROVANTE DE VENDA</div>
            <div className="text-center text-xs mb-3 border-b border-dashed border-gray-400 pb-2">
              Omni Gestão<br/>
              Data: {format(parseISO(selectedSale.createdAt), "dd/MM/yyyy HH:mm")}<br/>
              Ticket: #{String(selectedSale.saleNumber).padStart(4, '0')}
            </div>
            
            <table className="w-full text-left text-xs mb-2">
              <thead>
                <tr className="border-b border-dashed border-gray-400">
                  <th className="py-1">Qtd</th>
                  <th className="py-1">Produto</th>
                  <th className="py-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedSale.items.map((item: any, idx) => (
                  <tr key={idx}>
                    <td className="py-1 align-top">{item.quantity}x</td>
                    <td className="py-1 pr-1 truncate max-w-[120px] align-top">{item.product.name}</td>
                    <td className="py-1 text-right align-top">R$ {(item.unitPrice * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="border-t border-dashed border-gray-400 pt-2 mb-3">
              <div className="flex justify-between font-bold text-base mb-1">
                <span>TOTAL</span>
                <span>R$ {selectedSale.total.toFixed(2)}</span>
              </div>
              <div className="text-xs">
                <div className="flex justify-between">
                  <span>Pagamento:</span>
                  <span>
                    {paymentMethodMap[selectedSale.paymentMethod] || selectedSale.paymentMethod}
                    {(selectedSale.paymentMethod === 'CREDIT' || selectedSale.paymentMethod === 'CREDIARIO') && selectedSale.installments && selectedSale.installments > 1 ? ` (${selectedSale.installments}x)` : ''}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-center text-xs border-t border-dashed border-gray-400 pt-2">
              Obrigado pela preferência!<br/>
              Volte sempre!
            </div>
          </div>
        </>
      )}

    </div>
  );
}
