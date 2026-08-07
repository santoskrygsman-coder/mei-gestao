import { useState, useEffect } from 'react';
import { Plus, Users, Trash2 } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  city?: string;
  state?: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [document, setDocument] = useState('');
  
  // Novos campos
  const [cep, setCep] = useState('');
  const [address, setAddress] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [notes, setNotes] = useState('');

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name, email, phone, document,
          cep, address, number, complement, neighborhood, city, state, notes
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        setName(''); setEmail(''); setPhone(''); setDocument('');
        setCep(''); setAddress(''); setNumber(''); setComplement(''); setNeighborhood(''); setCity(''); setState(''); setNotes('');
        fetchCustomers();
      }
    } catch (e) {
      alert("Erro ao salvar cliente");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja apagar este cliente?')) return;
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      await fetch(`${apiUrl}/api/customers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchCustomers();
    } catch (e) {
      alert("Erro ao deletar cliente");
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
          onClick={() => setIsModalOpen(true)}
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
                <th className="p-4 font-semibold text-gray-600 text-sm">Documento (CPF/CNPJ)</th>
                <th className="p-4 font-semibold text-gray-600 text-sm text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
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
                    <td className="p-4 text-right">
                      <button onClick={() => handleDelete(c.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 my-8">
            <h3 className="text-xl font-bold mb-4">Novo Cliente</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                  <input required type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (Opcional)</label>
                  <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF ou CNPJ</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={document} onChange={e => setDocument(e.target.value)} />
                </div>
              </div>

              <hr className="my-4 border-gray-100" />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={cep} onChange={e => setCep(e.target.value)} placeholder="00000-000" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, Avenida..." />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={number} onChange={e => setNumber(e.target.value)} />
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
    </div>
  );
}
