import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import TransactionModal from '../components/TransactionModal';
import { CardSkeleton, Skeleton } from '../components/Skeleton';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
  category: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      } else if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Calculations
  const income = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = income - expense;

  // Chart Data preparation (aggregate by date)
  const chartDataMap = new Map<string, { date: string; receitas: number; despesas: number }>();
  
  [...transactions].reverse().forEach(t => {
    // Evita problema de fuso horário convertendo "2026-08-08T00:00:00.000Z" para "2026-08-08" antes do parse
    const dayString = t.date.split('T')[0];
    const day = format(parseISO(dayString), 'dd/MMM', { locale: ptBR });
    if (!chartDataMap.has(day)) {
      chartDataMap.set(day, { date: day, receitas: 0, despesas: 0 });
    }
    const data = chartDataMap.get(day)!;
    if (t.type === 'income') data.receitas += t.amount;
    else data.despesas += t.amount;
  });

  const chartData = Array.from(chartDataMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Expense Pie Chart Data
  const expenseByCategoryMap = new Map<string, number>();
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const cat = t.category || 'Outros';
    expenseByCategoryMap.set(cat, (expenseByCategoryMap.get(cat) || 0) + t.amount);
  });
  
  const pieData = Array.from(expenseByCategoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];

  return (
    <div className="text-gray-900 font-sans">
      {/* Dashboard Content */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
            <p className="text-gray-500 mt-1">Acompanhe a saúde financeira da sua empresa em tempo real.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 hover:shadow-blue-300"
          >
            <Plus size={20} />
            Nova Transação
          </button>
        </div>

        {loading ? (
          <div className="animate-in fade-in duration-300">
            <CardSkeleton count={3} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <Skeleton className="h-6 w-48 mb-6" />
                <Skeleton className="h-[320px] w-full" />
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <Skeleton className="h-6 w-48 mb-6" />
                <Skeleton className="h-[320px] w-full" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Saldo Atual</p>
                    <h3 className={`text-3xl font-bold ${balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                      R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                  <div className={`p-3 rounded-full ${balance >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                    <DollarSign size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Entradas do Mês</p>
                    <h3 className="text-2xl font-bold text-green-600">
                      R$ {income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                  <div className="p-3 bg-green-50 text-green-600 rounded-full">
                    <TrendingUp size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">Saídas do Mês</p>
                    <h3 className="text-2xl font-bold text-red-600">
                      R$ {expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                  <div className="p-3 bg-red-50 text-red-600 rounded-full">
                    <TrendingDown size={24} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Chart Section */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Faturamento Recente</h3>
                {chartData.length > 0 ? (
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} tickLine={false} axisLine={false} />
                        <YAxis tick={{fontSize: 12, fill: '#6b7280'}} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value}`} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, '']}
                        />
                        <Bar dataKey="receitas" name="Receitas" fill="#2563eb" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="despesas" name="Despesas" fill="#dc2626" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[320px] flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    Nenhuma transação registrada ainda. Clique em "Nova Transação" para começar!
                  </div>
                )}
              </div>

              {/* Expense Pie Chart */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Despesas por Categoria</h3>
                {pieData.length > 0 ? (
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="45%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, '']}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[320px] flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    Nenhuma despesa registrada.
                  </div>
                )}
              </div>

              {/* Transactions List */}
              <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-[400px] hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Últimas Transações</h3>
                <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-3 custom-scrollbar">
                  {transactions.length === 0 ? (
                    <div className="text-center text-gray-500 mt-10">
                      Seu histórico aparecerá aqui.
                    </div>
                  ) : (
                    transactions.map((t) => (
                      <div key={t.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${t.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {t.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm truncate max-w-[120px]" title={t.description}>{t.description}</p>
                            <p className="text-xs text-gray-500">{format(parseISO(t.date.split('T')[0]), 'dd/MM/yyyy')}</p>
                          </div>
                        </div>
                        <div className={`font-bold text-sm ${t.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
                          {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchTransactions} 
      />
    </div>
  );
}
