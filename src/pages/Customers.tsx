import { useState, useEffect } from 'react';
import { Plus, Users, Trash2 } from 'lucide-react';
import { FeedbackModal } from '../components/FeedbackModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { TableSkeleton } from '../components/Skeleton';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  city?: string;
  state?: string;
  creditLimit: number;
}

interface CustomerAccountData {
  creditLimit: number;
  totalUsed: number;
  availableCredit: number;
  pendingSales: Array<{
    id: string;
    saleNumber: number;
    total: number;
    amountPaid: number;
    createdAt: string;
  }>;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [document, setDocument] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Novos campos
  const [cep, setCep] = useState('');
  const [address, setAddress] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [notes, setNotes] = useState('');

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string | React.ReactNode;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    customerId: string | null;
  }>({
    isOpen: false,
    customerId: null
  });

  const [payModal, setPayModal] = useState<{
    isOpen: boolean;
    saleId: string | null;
    remaining: number;
    amountToPay: string;
  }>({
    isOpen: false,
    saleId: null,
    remaining: 0,
    amountToPay: ''
  });

  const showModal = (type: 'success' | 'error' | 'info', title: string, message: string | React.ReactNode) => {
    setModalState({ isOpen: true, type, title, message });
  };

  const [accountModal, setAccountModal] = useState<{
    isOpen: boolean;
    customer: Customer | null;
    data: CustomerAccountData | null;
    loading: boolean;
  }>({
    isOpen: false,
    customer: null,
    data: null,
    loading: false
  });

  const openAccount = async (customer: Customer) => {
    setAccountModal({ isOpen: true, customer, data: null, loading: true });
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/customers/${customer.id}/account`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAccountModal({ isOpen: true, customer, data, loading: false });
      } else {
        setAccountModal({ isOpen: false, customer: null, data: null, loading: false });
        showModal('error', 'Erro', 'Erro ao carregar conta do cliente.');
      }
    } catch (e) {
      setAccountModal({ isOpen: false, customer: null, data: null, loading: false });
      showModal('error', 'Erro', 'Erro de conexão.');
    }
  };

  const payNotinha = async () => {
    if (!accountModal.customer || !payModal.saleId) return;
    const saleId = payModal.saleId;
    const amount = Number(payModal.amountToPay);
    
    if (isNaN(amount) || amount <= 0 || amount > payModal.remaining) {
      showModal('error', 'Erro', 'Valor inválido.');
      return;
    }

    setPayModal({ isOpen: false, saleId: null, remaining: 0, amountToPay: '' });
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/sales/${saleId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ paymentMethod: 'CASH', amount }) 
      });
      if (res.ok) {
        showModal('success', 'Pagamento Recebido', 'Notinha baixada com sucesso.');
        openAccount(accountModal.customer); 
      } else {
        showModal('error', 'Erro', 'Erro ao dar baixa.');
      }
    } catch (e) {
      showModal('error', 'Erro', 'Erro de conexão.');
    }
  };

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/customers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setCustomers(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const formatCPF_CNPJ = (val: string) => {
    const v = val.replace(/\D/g, "");
    if (v.length <= 11) {
      return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  const formatPhone = (val: string) => {
    const v = val.replace(/\D/g, "");
    return v.replace(/(\d{2})(\d{4,5})(\d{4})/, "($1) $2-$3");
  };

  const formatCEP = (val: string) => {
    const v = val.replace(/\D/g, "");
    return v.replace(/(\d{5})(\d{1,3})/, "$1-$2");
  };

  // Buscar CEP automaticamente
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCep = formatCEP(e.target.value);
    setCep(newCep);

    const cepNumbers = newCep.replace(/\D/g, "");
    if (cepNumbers.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cepNumbers}/json/`);
        if (res.ok) {
          const data = await res.json();
          if (!data.erro) {
            if (data.logradouro) setAddress(data.logradouro);
            if (data.bairro) setNeighborhood(data.bairro);
            if (data.localidade) setCity(data.localidade);
            if (data.uf) setState(data.uf);
            // foca no número
            document.getElementById('addressNumber')?.focus();
          }
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const url = editingId ? `${apiUrl}/api/customers/${editingId}` : `${apiUrl}/api/customers`;
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name, email, phone, document,
          cep, address, number, complement, neighborhood, city, state, notes, creditLimit
        })
      });

      if (res.ok) {
        showModal('success', editingId ? 'Cliente Atualizado' : 'Cliente Salvo', `O cadastro foi ${editingId ? 'atualizado' : 'salvo'} com sucesso.`);
        setIsModalOpen(false);
        setEditingId(null);
        setName(''); setEmail(''); setPhone(''); setDocument(''); setCreditLimit('');
        setCep(''); setAddress(''); setNumber(''); setComplement(''); setNeighborhood(''); setCity(''); setState(''); setNotes('');
        fetchCustomers();
      } else {
        showModal('error', 'Erro', 'Erro ao salvar cliente.');
      }
    } catch (e) {
      showModal('error', 'Erro', 'Erro de conexão ao salvar cliente.');
    }
  };

  const confirmDelete = (id: string) => {
    setConfirmModal({ isOpen: true, customerId: id });
  };

  const handleDelete = async () => {
    if (!confirmModal.customerId) return;
    const id = confirmModal.customerId;
    setConfirmModal({ isOpen: false, customerId: null });
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/customers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showModal('success', 'Cliente Deletado', 'O cliente foi removido do sistema.');
        fetchCustomers();
      } else {
        showModal('error', 'Erro', 'Erro ao deletar cliente.');
      }
    } catch (e) {
      showModal('error', 'Erro', 'Erro de conexão ao deletar cliente.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500">Gerencie sua carteira de clientes.</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setName(''); setEmail(''); setPhone(''); setDocument(''); setCreditLimit('');
            setCep(''); setAddress(''); setNumber(''); setComplement(''); setNeighborhood(''); setCity(''); setState(''); setNotes('');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Novo Cliente
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-semibold text-gray-600 text-sm">Nome</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Contato</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Documento</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Crédito</th>
                <th className="p-4 font-semibold text-gray-600 text-sm text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <TableSkeleton rows={5} columns={5} />
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    <Users className="mx-auto text-gray-300 mb-3" size={48} />
                    Nenhum cliente cadastrado.
                  </td>
                </tr>
              ) : (
                customers.map(c => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{c.name}</td>
                    <td className="p-4 text-gray-600 text-sm">
                      <div>{c.phone || '-'}</div>
                      <div className="text-gray-400 text-xs">{c.email || ''}</div>
                    </td>
                    <td className="p-4 text-gray-600">
                      <div>{c.document || '-'}</div>
                      <div className="text-gray-400 text-xs">{c.city ? `${c.city}/${c.state}` : ''}</div>
                    </td>
                    <td className="p-4 text-gray-600">
                      <div className="font-medium text-gray-900">R$ {c.creditLimit?.toFixed(2) || '0.00'}</div>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                        <button 
                          onClick={() => openAccount(c)}
                          className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                        >
                          Conta / Notinhas
                        </button>
                        <button 
                          onClick={() => {
                            setEditingId(c.id);
                            setName(c.name); setEmail(c.email || ''); setPhone(c.phone || ''); setDocument(c.document || ''); setCreditLimit(c.creditLimit ? String(c.creditLimit) : '');
                            setIsModalOpen(true);
                            // Observação: CEP e endereços não retornam do GET /customers na listagem resumida
                            // Ideal seria fazer um GET /customers/:id se quisesse editar endereço completo
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => confirmDelete(c.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 my-8 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-4">{editingId ? 'Editar Cliente' : 'Novo Cliente'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                  <input type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (Opcional)</label>
                  <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
                  <input type="text" maxLength={15} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={phone} onChange={e => setPhone(formatPhone(e.target.value))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF ou CNPJ</label>
                  <input type="text" maxLength={18} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={document} onChange={e => setDocument(formatCPF_CNPJ(e.target.value))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Limite Crediário (R$)</label>
                  <input type="number" step="0.01" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} placeholder="0.00" />
                </div>
              </div>

              <div className="col-span-2 mt-4">
                <h4 className="font-bold text-gray-700 border-b pb-1 mb-2">Endereço</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                  <input type="text" maxLength={9} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" value={cep} onChange={handleCepChange} placeholder="00000-000" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, Avenida..." />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                  <input id="addressNumber" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={number} onChange={e => setNumber(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={complement} onChange={e => setComplement(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={city} onChange={e => setCity(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado (UF)</label>
                  <input type="text" maxLength={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg uppercase" value={state} onChange={e => setState(e.target.value.toUpperCase())} placeholder="SP, RJ, MG..." />
                </div>
              </div>

              <hr className="my-4 border-gray-100" />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações (Opcional)</label>
                <textarea rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Informações adicionais sobre o cliente..." />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Cancelar</button>
                <button type="submit" className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium shadow-sm">Salvar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Modal */}
      {accountModal.isOpen && accountModal.customer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 bg-blue-600 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">Conta / Notinhas: {accountModal.customer.name}</h3>
              <button onClick={() => setAccountModal(prev => ({ ...prev, isOpen: false }))} className="text-blue-100 hover:text-white">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
              {accountModal.loading ? (
                <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
              ) : accountModal.data ? (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <p className="text-sm text-gray-500 font-medium mb-1">Limite Total</p>
                      <p className="text-xl font-bold text-gray-900">R$ {accountModal.data.creditLimit.toFixed(2)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <p className="text-sm text-gray-500 font-medium mb-1">Em Uso</p>
                      <p className="text-xl font-bold text-orange-600">R$ {accountModal.data.totalUsed.toFixed(2)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <p className="text-sm text-gray-500 font-medium mb-1">Disponível</p>
                      <p className={`text-xl font-bold ${accountModal.data.availableCredit > 0 ? 'text-green-600' : 'text-red-600'}`}>R$ {accountModal.data.availableCredit.toFixed(2)}</p>
                    </div>
                  </div>

                  <h4 className="font-bold text-gray-900 mb-3">Notinhas Pendentes</h4>
                  {accountModal.data.pendingSales.length === 0 ? (
                    <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
                      Nenhuma notinha pendente.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {accountModal.data.pendingSales.map(sale => (
                        <div key={sale.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-gray-900">Venda #{String(sale.saleNumber).padStart(4, '0')}</span>
                              <span className="text-xs text-gray-500">{new Date(sale.createdAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="text-2xl font-black text-red-600">
                              R$ {(sale.total - sale.amountPaid).toFixed(2)}
                            </div>
                            {sale.amountPaid > 0 && (
                              <div className="text-sm text-gray-500">
                                Total: R$ {sale.total.toFixed(2)} (Pago: R$ {sale.amountPaid.toFixed(2)})
                              </div>
                            )}
                          </div>
                          <button 
                            onClick={() => {
                              const remaining = sale.total - sale.amountPaid;
                              setPayModal({ isOpen: true, saleId: sale.id, remaining, amountToPay: remaining.toFixed(2) });
                            }}
                            className="w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors shadow-sm whitespace-nowrap"
                          >
                            Dar Baixa (Receber)
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <FeedbackModal 
        isOpen={modalState.isOpen}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Excluir Cliente"
        message="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        onCancel={() => setConfirmModal({ isOpen: false, customerId: null })}
        confirmText="Excluir"
      />

      {payModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 my-8 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-4">Receber Pagamento</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Qual valor você está recebendo agora? O total restante é de <strong className="text-red-600">R$ {payModal.remaining.toFixed(2)}</strong>.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor do Pagamento (R$)</label>
              <input 
                type="number" 
                step="0.01" 
                min="0"
                max={payModal.remaining}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 font-bold" 
                value={payModal.amountToPay} 
                onChange={e => setPayModal(prev => ({ ...prev, amountToPay: e.target.value }))} 
              />
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setPayModal({ isOpen: false, saleId: null, remaining: 0, amountToPay: '' })} 
                className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={payNotinha} 
                className="px-6 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium shadow-sm"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
