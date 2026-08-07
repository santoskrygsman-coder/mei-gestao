import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Trash2, CheckCircle2, User, CreditCard, Package } from 'lucide-react';
import { FeedbackModal } from '../components/FeedbackModal';

interface Product {
  id: string;
  name: string;
  salePrice: number;
  salePrice: number;
  stock: number;
  barcode: string;
  category?: string;
  imageUrl?: string;
}

interface Customer {
  id: string;
  name: string;
}

interface CartItem extends Product {
  cartQuantity: number;
}

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // CASH, PIX, CREDIT, DEBIT
  const [amountReceived, setAmountReceived] = useState<number | ''>('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Feedback Modal State
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

  // Credit Card Modal State
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [installments, setInstallments] = useState(1);

  const showModal = (type: 'success' | 'error' | 'info', title: string, message: string | React.ReactNode) => {
    setModalState({ isOpen: true, type, title, message });
  };


  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        
        const [prodRes, custRes] = await Promise.all([
          fetch(`${apiUrl}/api/products`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${apiUrl}/api/customers`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        if (prodRes.ok) setProducts(await prodRes.json());
        if (custRes.ok) setCustomers(await custRes.json());
      } catch (e) {
        console.error("Erro ao carregar dados do PDV");
      }
    };
    fetchData();
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.cartQuantity >= product.stock) {
          showModal('error', 'Estoque Insuficiente', `O produto "${product.name}" só possui ${product.stock} unidades em estoque.`);
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item);
      }
      if (product.stock <= 0) {
        showModal('error', 'Sem Estoque', `O produto "${product.name}" está esgotado.`);
        return prev;
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.cartQuantity + delta;
        if (newQ > item.stock) { 
          showModal('error', 'Estoque Insuficiente', `O produto "${item.name}" só possui ${item.stock} unidades.`);
          return item; 
        }
        if (newQ < 1) return item; // Use removeFromCart to remove
        return { ...item, cartQuantity: newQ };
      }
      return item;
    }));
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.barcode && p.barcode.includes(search))
  );

  const cartTotal = cart.reduce((acc, item) => acc + (item.salePrice * item.cartQuantity), 0);

  const initiateCheckout = () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'CREDIT') {
      setCreditModalOpen(true);
    } else {
      handleCheckout();
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    setCreditModalOpen(false); // Close it if it was open
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const payload = {
        total: cartTotal,
        paymentMethod,
        installments: paymentMethod === 'CREDIT' ? installments : 1, // Optional: add this to your backend later if needed
        customerId: selectedCustomerId || null,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.cartQuantity,
          unitPrice: item.salePrice
        }))
      };

      const res = await fetch(`${apiUrl}/api/sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const change = (paymentMethod === 'CASH' && typeof amountReceived === 'number') 
          ? amountReceived - cartTotal 
          : 0;

        showModal(
          'success', 
          'Venda Finalizada!', 
          <div className="flex flex-col items-center">
            <p className="mb-2">A venda foi registrada com sucesso.</p>
            {paymentMethod === 'CREDIT' && installments > 1 && (
              <div className="mt-2 text-blue-700 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 w-full text-center font-medium text-sm">
                Pagamento em {installments}x no Cartão de Crédito
              </div>
            )}
            {change > 0 && (
              <div className="mt-2 text-green-700 bg-green-50 px-4 py-3 rounded-lg border border-green-200 w-full font-bold">
                Troco a devolver: <br/><span className="text-2xl">R$ {change.toFixed(2)}</span>
              </div>
            )}
          </div>
        );
        
        setCart([]);
        setSelectedCustomerId('');
        setAmountReceived('');
        setInstallments(1);
        
        // Atualizar estoque localmente ou recarregar
        const updatedProds = await (await fetch(`${apiUrl}/api/products`, { headers: { 'Authorization': `Bearer ${token}` } })).json();
        setProducts(updatedProds);
      } else {
        showModal('error', 'Erro na Venda', 'Ocorreu um erro ao tentar finalizar a venda.');
      }
    } catch (e) {
      console.error(e);
      showModal('error', 'Erro de Conexão', 'Não foi possível conectar ao servidor para finalizar a venda.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col-reverse lg:flex-row gap-6">
      
      {/* Esquerda (Agora Carrinho/Caixa Livre): Foco Principal */}
      <div className="w-full lg:w-[55%] xl:w-[60%] flex flex-col h-full bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden shrink-0">
        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart size={24} />
            <h2 className="text-xl font-bold">Caixa Livre</h2>
          </div>
          {cart.length > 0 && (
            <button 
              onClick={() => setCart([])}
              className="text-blue-100 hover:text-white text-sm font-medium transition-colors"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Lista de Itens */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-gray-50/50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart size={40} className="text-gray-300" />
              </div>
              <p className="font-medium text-gray-500">Seu carrinho está vazio</p>
              <p className="text-sm mt-1">Busque e adicione produtos ao lado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex gap-3 items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h4>
                    <div className="text-blue-600 font-bold text-sm mt-0.5">R$ {item.salePrice.toFixed(2)}</div>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 rounded hover:bg-white hover:shadow-sm flex items-center justify-center font-bold text-gray-600 transition-all">-</button>
                    <span className="w-8 text-center font-bold text-sm text-gray-900">{item.cartQuantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 rounded hover:bg-white hover:shadow-sm flex items-center justify-center font-bold text-gray-600 transition-all">+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg ml-1 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checkout Footer */}
        <div className="border-t border-gray-100 p-6 bg-gray-50 flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <User size={16} /> Cliente (Opcional)
              </label>
              <select 
                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg outline-none"
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
              >
                <option value="">Consumidor Final (Sem cadastro)</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <CreditCard size={16} /> Pagamento
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <button type="button" onClick={() => setPaymentMethod('CASH')} className={`py-2 rounded-lg text-sm font-semibold border ${paymentMethod === 'CASH' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}>Dinheiro</button>
                <button type="button" onClick={() => setPaymentMethod('PIX')} className={`py-2 rounded-lg text-sm font-semibold border ${paymentMethod === 'PIX' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}>PIX</button>
                <button type="button" onClick={() => setPaymentMethod('CREDIT')} className={`py-2 rounded-lg text-sm font-semibold border ${paymentMethod === 'CREDIT' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}>Crédito</button>
                <button type="button" onClick={() => setPaymentMethod('DEBIT')} className={`py-2 rounded-lg text-sm font-semibold border ${paymentMethod === 'DEBIT' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}>Débito</button>
              </div>
            </div>

            {paymentMethod === 'CASH' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Recebido (R$)</label>
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 50,00"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value === '' ? '' : Number(e.target.value))}
                />
                {typeof amountReceived === 'number' && amountReceived >= cartTotal && cartTotal > 0 && (
                  <div className="mt-2 text-green-700 bg-green-50 p-2 rounded-lg text-sm font-bold border border-green-200 flex justify-between">
                    <span>Troco a devolver:</span>
                    <span>R$ {(amountReceived - cartTotal).toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="w-full md:w-1/3 flex flex-col justify-end">
            <div className="flex justify-between items-center py-3 mb-2 border-t border-gray-200 md:border-t-0 mt-2 md:mt-0">
              <span className="text-gray-500 font-medium">Total a Pagar</span>
              <span className="text-4xl font-black text-gray-900">R$ {cartTotal.toFixed(2)}</span>
            </div>

            <button 
              onClick={initiateCheckout}
              disabled={cart.length === 0 || isProcessing}
              className="w-full py-5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-200 disabled:shadow-none"
            >
              {isProcessing ? 'Processando...' : (
                <>
                  <CheckCircle2 size={24} /> Finalizar Venda
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Direita (Agora Lista de Produtos): Menor */}
      <div className="flex-1 flex flex-col h-full bg-gray-50 rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-w-[350px]">
        <div className="p-5 border-b border-gray-200 bg-white shadow-sm z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="Buscar por nome ou código de barras..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                className={`relative flex flex-col text-left p-0 rounded-2xl border transition-all duration-200 overflow-hidden ${
                  product.stock > 0 
                    ? 'border-gray-200 hover:border-blue-500 hover:shadow-lg bg-white transform hover:-translate-y-1' 
                    : 'border-gray-100 bg-gray-100 opacity-60 cursor-not-allowed grayscale'
                }`}
              >
                {/* Imagem Placeholder ou Real */}
                <div className="h-32 w-full bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center border-b border-gray-100 overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package size={48} className="text-gray-300" />
                  )}
                </div>
                
                <div className="p-4 flex-1 flex flex-col">
                  <div className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">
                    {product.category || 'Geral'}
                  </div>
                  <div className="font-bold text-gray-900 mb-1 leading-tight line-clamp-2" title={product.name}>
                    {product.name}
                  </div>
                  <div className="text-xs text-gray-400 mb-4 font-mono">{product.barcode || 'Sem cód.'}</div>
                  
                  <div className="mt-auto flex justify-between items-end">
                    <div className="font-black text-xl text-gray-900">
                      R$ {product.salePrice.toFixed(2)}
                    </div>
                    <div className={`text-xs font-bold px-2 py-1 rounded-md ${product.stock > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {product.stock} un
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <FeedbackModal 
        isOpen={modalState.isOpen}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
        actionButtonText={modalState.type === 'success' ? 'Nova Venda' : 'Entendi'}
      />

      {/* Modal de Confirmação - Crédito */}
      {creditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-100 bg-blue-600 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <CreditCard size={20} /> Detalhes do Cartão
              </h3>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Total</label>
                <div className="text-3xl font-black text-gray-900">R$ {cartTotal.toFixed(2)}</div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Número de Parcelas</label>
                <select 
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium"
                  value={installments}
                  onChange={(e) => setInstallments(Number(e.target.value))}
                >
                  {[...Array(12)].map((_, i) => {
                    const times = i + 1;
                    const valuePerInstallment = cartTotal / times;
                    return (
                      <option key={times} value={times}>
                        {times}x de R$ {valuePerInstallment.toFixed(2)}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setCreditModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 transition-all flex justify-center items-center"
                >
                  {isProcessing ? 'Aguarde...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
