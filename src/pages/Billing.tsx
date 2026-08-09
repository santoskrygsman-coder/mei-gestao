import { useState, useEffect } from 'react';
import { Lock, CreditCard, CheckCircle, ArrowRight } from 'lucide-react';
import { FeedbackModal } from '../components/FeedbackModal';

export default function Billing() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [modalState, setModalState] = useState<{ isOpen: boolean; type: 'error' | 'success'; title: string; message: string }>({
    isOpen: false,
    type: 'error',
    title: '',
    message: ''
  });

  useEffect(() => {
    // Busca o status atual da assinatura
    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/billing/status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setStatus(await res.json());
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchStatus();
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const res = await fetch(`${apiUrl}/api/billing/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redireciona para o Checkout do Stripe
      } else {
        setModalState({ isOpen: true, type: 'error', title: 'Erro', message: 'Erro ao iniciar pagamento. Verifique as configurações.' });
      }
    } catch (err) {
      setModalState({ isOpen: true, type: 'error', title: 'Erro de Conexão', message: 'Falha ao conectar com servidor de pagamento.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Lado Esquerdo - Info */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-gray-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-blue-600 opacity-20 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-purple-600 opacity-20 blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
              <Lock className="text-blue-400" size={32} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Acesso Bloqueado</h1>
            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              Seu período de testes de 7 dias expirou. Para continuar utilizando o Omni Gestão e gerenciando seu negócio com eficiência, você precisa de uma assinatura ativa.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-400" size={24} />
                <span className="text-gray-200">Emissão de Recibos 80mm</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-400" size={24} />
                <span className="text-gray-200">Controle de Estoque e PDV</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-400" size={24} />
                <span className="text-gray-200">Relatórios Financeiros</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito - Pagamento */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Desbloqueie seu acesso</h2>
          <p className="text-gray-500 mb-8">Pague com PIX ou Cartão de Crédito.</p>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-8 relative">
            <div className="absolute -top-3 right-6 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              PLANO MENSAL
            </div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-black text-gray-900">R$ 49,99</span>
              <span className="text-gray-500 font-medium mb-1">/ mês</span>
            </div>
            <p className="text-sm text-gray-600">Sem fidelidade. Cancele quando quiser.</p>
          </div>

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-gray-200 disabled:opacity-70"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <CreditCard size={20} />
                Assinar Agora
                <ArrowRight size={20} className="ml-2" />
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400 mt-6 flex items-center justify-center gap-2">
            <Lock size={12} /> Pagamento 100% seguro via Stripe
          </p>
        </div>

      </div>

      <FeedbackModal 
        isOpen={modalState.isOpen}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
