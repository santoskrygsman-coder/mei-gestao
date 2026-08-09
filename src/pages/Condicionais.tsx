import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageOpen, CheckCircle2, XCircle, Search } from 'lucide-react';
import { format } from 'date-fns';
import { FeedbackModal } from '../components/FeedbackModal';
import { ConfirmModal } from '../components/ConfirmModal';

export default function Condicionais() {
  const navigate = useNavigate();
  const [sales, setSales] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalState, setModalState] = useState<{isOpen: boolean; type: 'success'|'error'|'info'; title: string; message: string}>({
    isOpen: false, type: 'info', title: '', message: ''
  });
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [selectedCondicional, setSelectedCondicional] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('CREDIT');
  const [installments, setInstallments] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Confirm Return Modal State
  const [confirmReturnOpen, setConfirmReturnOpen] = useState(false);
  const [condicionalToReturn, setCondicionalToReturn] = useState<string | null>(null);

  const fetchSales = async () => {
    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    try {
      const res = await fetch(`${apiUrl}/api/sales`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSales(data.filter((s: any) => s.status === 'CONDICIONAL'));
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const showModal = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setModalState({ isOpen: true, type, title, message });
  };

  const handleFinalize = async () => {
    if (!selectedCondicional) return;
    setIsProcessing(true);
    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    try {
      const res = await fetch(`${apiUrl}/api/sales/${selectedCondicional.id}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ paymentMethod })
      });

      if (res.ok) {
        showModal('success', 'Condicional Finalizada!', 'A venda foi concluída e registrada no caixa com sucesso.');
        setFinalizeModalOpen(false);
        fetchSales();
      } else {
        const data = await res.json();
        showModal('error', 'Erro', data.error || 'Não foi possível finalizar.');
      }
    } catch (error) {
      showModal('error', 'Erro', 'Erro de conexão com o servidor.');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmReturn = (id: string) => {
    setCondicionalToReturn(id);
    setConfirmReturnOpen(true);
  };

  const handleReturn = async () => {
    if (!condicionalToReturn) return;
    setConfirmReturnOpen(false);
    
    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    try {
      const res = await fetch(`${apiUrl}/api/sales/${condicionalToReturn}/return`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        showModal('success', 'Devolução Concluída', 'Os itens voltaram para o estoque.');
        fetchSales();
      } else {
        showModal('error', 'Erro', 'Não foi possível devolver.');
      }
    } catch (error) {
      showModal('error', 'Erro', 'Erro de conexão.');
    }
  };

  const handleLevarAoPDV = async () => {
    if (!selectedCondicional) return;
    setIsProcessing(true);
    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    try {
      // 1. Devolve a condicional (volta pro estoque temporariamente)
      const res = await fetch(`${apiUrl}/api/sales/${selectedCondicional.id}/return`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        // 2. Mapeia itens para o formato do carrinho e envia pro PDV
        const cartItems = selectedCondicional.items.map((item: any) => ({
          ...item.product,
          cartQuantity: item.quantity
        }));
        navigate('/pos', { 
          state: { 
            resumeCondicional: true, 
            cart: cartItems, 
            customerId: selectedCondicional.customerId 
          } 
        });
      } else {
        showModal('error', 'Erro', 'Não foi possível mover a condicional para o PDV.');
      }
    } catch (error) {
      showModal('error', 'Erro', 'Erro de conexão.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredSales = sales.filter(sale => {
    const searchStr = searchTerm.toLowerCase();
    const customerName = sale.customer?.name?.toLowerCase() || '';
    const saleNumStr = String(sale.saleNumber);
    return customerName.includes(searchStr) || saleNumStr.includes(searchStr) || sale.id.toLowerCase().includes(searchStr);
  });

  return (
    <div className="h-full flex flex-col">
      <FeedbackModal 
        isOpen={modalState.isOpen}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
      />
      
      <ConfirmModal
        isOpen={confirmReturnOpen}
        title="Devolver Condicional?"
        message="Os itens retornarão para o estoque imediatamente. Tem certeza que deseja cancelar esta condicional?"
        confirmText="Sim, Devolver"
        onConfirm={handleReturn}
        onCancel={() => setConfirmReturnOpen(false)}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <PackageOpen className="text-orange-500" />
            Condicionais (Consignado)
          </h1>
          <p className="text-gray-500 mt-1">Gerencie produtos que estão com clientes em condicional.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <input 
            type="text" 
            placeholder="Buscar por cliente ou Nº da venda..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-6">
        {filteredSales.map((sale) => (
          <div key={sale.id} className="bg-white border border-orange-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full uppercase tracking-wide">
                  Condicional #{String(sale.saleNumber).padStart(4, '0')}
                </span>
                <h3 className="font-bold text-gray-900 mt-2 text-lg truncate" title={sale.customer?.name || 'Cliente Não Informado'}>
                  {sale.customer?.name || 'Cliente Não Informado'}
                </h3>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-gray-900">R$ {sale.total.toFixed(2)}</div>
                <div className="text-xs text-gray-500 mt-1">{format(new Date(sale.createdAt), "dd/MM/yyyy HH:mm")}</div>
              </div>
            </div>

            <div className="flex-1 bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100 overflow-y-auto max-h-40">
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Itens:</h4>
              <ul className="space-y-2">
                {sale.items.map((item: any) => (
                  <li key={item.id} className="flex justify-between text-sm">
                    <span className="truncate pr-2">{item.quantity}x {item.product.name}</span>
                    <span className="font-medium text-gray-700 whitespace-nowrap">R$ {item.totalPrice.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-auto">
              <button 
                onClick={() => confirmReturn(sale.id)}
                className="py-2 px-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <XCircle size={18} /> Devolver
              </button>
              <button 
                onClick={() => {
                  setSelectedCondicional(sale);
                  setPaymentMethod('CREDIT');
                  setInstallments(1);
                  setFinalizeModalOpen(true);
                }}
                className="py-2 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <CheckCircle2 size={18} /> Finalizar
              </button>
            </div>
          </div>
        ))}

        {filteredSales.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-2xl border border-gray-200 border-dashed">
            <PackageOpen size={48} className="text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">Nenhuma condicional aberta.</h3>
            <p className="text-gray-500">Gere uma condicional no Frente de Caixa para vê-la aqui.</p>
          </div>
        )}
      </div>

      {/* Payment Finalize Modal */}
      {finalizeModalOpen && selectedCondicional && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-100 bg-orange-500 text-white">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <CheckCircle2 size={20} /> Finalizar Condicional
              </h3>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Total</label>
                <div className="text-3xl font-black text-gray-900">R$ {selectedCondicional.total.toFixed(2)}</div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
                <select 
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="CREDIT">Cartão de Crédito</option>
                  <option value="DEBIT">Cartão de Débito</option>
                  <option value="PIX">PIX</option>
                  <option value="CASH">Dinheiro</option>
                </select>
              </div>

              {paymentMethod === 'CREDIT' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Número de Parcelas</label>
                  <select 
                    className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-lg font-medium"
                    value={installments}
                    onChange={(e) => setInstallments(Number(e.target.value))}
                  >
                    {[...Array(12)].map((_, i) => {
                      const times = i + 1;
                      const valuePerInstallment = selectedCondicional.total / times;
                      return (
                        <option key={times} value={times}>
                          {times}x de R$ {valuePerInstallment.toFixed(2)}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={handleLevarAoPDV}
                  disabled={isProcessing}
                  className="w-full py-3 px-4 rounded-xl font-bold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors shadow-sm"
                >
                  Levar itens ao PDV
                </button>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setFinalizeModalOpen(false)}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleFinalize}
                    disabled={isProcessing}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-md transition-all flex justify-center items-center"
                  >
                    {isProcessing ? 'Aguarde...' : 'Confirmar Pgto.'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
