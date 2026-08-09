import { useState, useEffect, useRef } from 'react';
import { Plus, Package, Trash2, Upload, Image as ImageIcon, ArrowUpCircle, Edit } from 'lucide-react';
import { FeedbackModal } from '../components/FeedbackModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { TableSkeleton } from '../components/Skeleton';

interface Product {
  id: string;
  name: string;
  barcode: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  category: string;
  imageUrl?: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('5');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [margin, setMargin] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const openNewModal = () => {
    setEditingProductId(null);
    setName(''); setBarcode(''); setCostPrice(''); setSalePrice(''); setStock(''); setMargin('');
    setMinStock('5'); setCategory(''); setDescription(''); setImageUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProductId(p.id);
    setName(p.name);
    setBarcode(p.barcode || '');
    setCostPrice(p.costPrice > 0 ? p.costPrice.toFixed(2).replace('.', ',') : '');
    setSalePrice(p.salePrice.toFixed(2).replace('.', ','));
    setStock(String(p.stock));
    setMinStock(String(p.minStock));
    setCategory(p.category || '');
    setDescription(p.description || '');
    setImageUrl(p.imageUrl || '');
    
    if (p.costPrice > 0) {
      const m = ((p.salePrice - p.costPrice) / p.costPrice) * 100;
      setMargin(m.toFixed(2));
    } else {
      setMargin('');
    }
    
    setIsModalOpen(true);
  };

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
    productId: string | null;
  }>({
    isOpen: false,
    productId: null
  });

  const [stockModal, setStockModal] = useState<{
    isOpen: boolean;
    productId: string | null;
    productName: string;
    amount: string;
  }>({
    isOpen: false,
    productId: null,
    productName: '',
    amount: '1'
  });

  const showModal = (type: 'success' | 'error' | 'info', title: string, message: string | React.ReactNode) => {
    setModalState({ isOpen: true, type, title, message });
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const catRes = await fetch(`${apiUrl}/api/categories?type=PRODUCT`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setProducts(await res.json());
      }
      if (catRes.ok) {
        setCategoriesList(await catRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const formatCurrency = (val: string) => {
    const v = val.replace(/\D/g, "");
    if (!v) return "";
    const num = Number(v) / 100;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getNumericValue = (val: string) => Number(val.replace(/\./g, "").replace(",", "."));

  // Lógica de cálculo de margem
  const handleCostChange = (val: string) => {
    const formatted = formatCurrency(val);
    setCostPrice(formatted);
    if (margin && formatted) {
      const cost = getNumericValue(formatted);
      const m = Number(margin);
      const sale = cost + (cost * (m / 100));
      setSalePrice(sale.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    }
  };

  const handleSaleChange = (val: string) => {
    const formatted = formatCurrency(val);
    setSalePrice(formatted);
    if (costPrice && formatted) {
      const cost = getNumericValue(costPrice);
      const sale = getNumericValue(formatted);
      if (cost > 0) {
        const m = ((sale - cost) / cost) * 100;
        setMargin(m.toFixed(2));
      }
    }
  };

  const handleMarginChange = (val: string) => {
    setMargin(val);
    if (costPrice && val) {
      const cost = getNumericValue(costPrice);
      const m = Number(val);
      const sale = cost + (cost * (m / 100));
      setSalePrice(sale.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        setImageUrl(data.imageUrl);
      } else {
        showModal('error', 'Erro', 'Erro ao enviar a imagem.');
      }
    } catch (err) {
      showModal('error', 'Erro', 'Erro de conexão ao enviar a imagem.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const payload = {
        name,
        barcode,
        category,
        description,
        imageUrl,
        costPrice: getNumericValue(costPrice),
        salePrice: getNumericValue(salePrice),
        stock: Number(stock),
        minStock: Number(minStock)
      };

      const url = editingProductId 
        ? `${apiUrl}/api/products/${editingProductId}`
        : `${apiUrl}/api/products`;
      
      const method = editingProductId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showModal('success', 'Produto Salvo', 'O produto foi salvo com sucesso.');
        setIsModalOpen(false);
        setEditingProductId(null);
        setName(''); setBarcode(''); setCostPrice(''); setSalePrice(''); setStock(''); setMargin('');
        setMinStock('5'); setCategory(''); setDescription(''); setImageUrl('');
        fetchProducts();
      } else {
        showModal('error', 'Erro', 'Erro ao salvar produto.');
      }
    } catch (e) {
      showModal('error', 'Erro', 'Erro de conexão ao salvar produto.');
    }
  };

  const confirmDelete = (id: string) => {
    setConfirmModal({ isOpen: true, productId: id });
  };

  const handleDelete = async () => {
    if (!confirmModal.productId) return;
    const id = confirmModal.productId;
    setConfirmModal({ isOpen: false, productId: null });
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showModal('success', 'Produto Deletado', 'O produto foi removido do sistema.');
        fetchProducts();
      } else {
        showModal('error', 'Erro', 'Erro ao deletar produto.');
      }
    } catch (e) {
      showModal('error', 'Erro', 'Erro de conexão ao deletar produto.');
    }
  };

  const handleStockEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockModal.productId) return;
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/products/${stockModal.productId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: Number(stockModal.amount) })
      });
      
      if (res.ok) {
        showModal('success', 'Estoque Atualizado', `Foi adicionado ${stockModal.amount} unidades de ${stockModal.productName}.`);
        setStockModal({ isOpen: false, productId: null, productName: '', amount: '1' });
        fetchProducts();
      } else {
        showModal('error', 'Erro', 'Erro ao dar entrada no estoque.');
      }
    } catch (err) {
      showModal('error', 'Erro', 'Erro de conexão ao atualizar estoque.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estoque de Produtos</h1>
          <p className="text-gray-500">Gerencie seus produtos e preços.</p>
        </div>
        <button 
          onClick={openNewModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Novo Produto
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Produto</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Código</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Preço Custo</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Preço Venda</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Estoque</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-sm text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <TableSkeleton rows={5} columns={6} />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <Package className="mx-auto text-gray-300 mb-3" size={48} />
                    Nenhum produto cadastrado.
                  </td>
                </tr>
              ) : (
                products.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-gray-100 dark:bg-gray-800" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <Package size={20} className="text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{p.name}</div>
                          <div className="text-gray-400 text-xs mt-0.5">{p.category || 'Sem Categoria'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-500 dark:text-gray-400 text-sm">{p.barcode || '-'}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">R$ {p.costPrice.toFixed(2)}</td>
                    <td className="p-4 text-green-600 dark:text-green-400 font-medium">R$ {p.salePrice.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.stock <= p.minStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {p.stock} un
                      </span>
                    </td>
                    <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => setStockModal({ isOpen: true, productId: p.id, productName: p.name, amount: '1' })}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Dar Entrada de Estoque"
                          >
                            <ArrowUpCircle size={18} />
                          </button>
                          <button 
                            onClick={() => openEditModal(p)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => confirmDelete(p.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          > 
                            <Trash2 size={18} />
                          </button>
                        </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Produto - Redesenhado */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 z-10">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="text-blue-600" /> {editingProductId ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Coluna da Imagem */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Foto do Produto</label>
                    <div 
                      className={`relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center overflow-hidden transition-all h-56 ${
                        imageUrl ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400 bg-gray-50'
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploadingImage ? (
                        <div className="text-blue-600 flex flex-col items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                          <span className="text-sm font-medium">Enviando...</span>
                        </div>
                      ) : imageUrl ? (
                        <>
                          <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                            <span className="text-white font-medium text-sm flex items-center gap-1"><Upload size={16}/> Trocar Foto</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-400 flex flex-col items-center cursor-pointer p-4 text-center">
                          <ImageIcon size={40} className="mb-2 text-gray-300" />
                          <span className="text-sm font-medium text-gray-600 mb-1">Clique para enviar</span>
                          <span className="text-xs text-gray-400">PNG, JPG até 5MB</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                    </div>
                  </div>
                </div>

                {/* Coluna dos Dados */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Informações Básicas */}
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                    <h4 className="font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-700 pb-2">Informações Principais</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Produto *</label>
                        <input required type="text" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:bg-white dark:focus:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Capinha Silicone iPhone 13" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código (Barras/SKU)</label>
                        <input type="text" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:bg-white dark:focus:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="0000000000" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                        <select className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:bg-white dark:focus:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={category} onChange={e => setCategory(e.target.value)}>
                          <option value="">Selecione ou deixe em branco</option>
                          {categoriesList.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Precificação */}
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                    <h4 className="font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-700 pb-2">Precificação</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preço de Custo (R$)</label>
                        <input type="text" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:bg-white dark:focus:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono" value={costPrice} onChange={e => handleCostChange(e.target.value)} placeholder="0,00" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Margem Lucro (%)</label>
                        <input type="number" step="0.01" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:bg-white dark:focus:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-blue-600 dark:text-blue-400 font-bold" value={margin} onChange={e => handleMarginChange(e.target.value)} placeholder="Ex: 50" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preço Venda (R$) *</label>
                        <input required type="text" className="w-full px-4 py-2.5 bg-blue-50/50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 font-bold rounded-lg focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono" value={salePrice} onChange={e => handleSaleChange(e.target.value)} placeholder="0,00" />
                      </div>
                    </div>
                  </div>

                  {/* Estoque e Detalhes */}
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                    <h4 className="font-bold text-gray-900 dark:text-white border-b border-gray-50 dark:border-gray-700 pb-2">Estoque e Detalhes</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estoque Atual *</label>
                        <input required type="number" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:bg-white dark:focus:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={stock} onChange={e => setStock(e.target.value)} placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estoque Mínimo *</label>
                        <input required type="number" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:bg-white dark:focus:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={minStock} onChange={e => setMinStock(e.target.value)} placeholder="5" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição (Opcional)</label>
                        <textarea rows={2} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:bg-white dark:focus:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes adicionais do produto..." />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </form>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 sticky bottom-0 z-10">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-xl font-medium transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={uploadingImage} className="px-6 py-2.5 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-xl font-bold shadow-md shadow-blue-200 dark:shadow-none transition-colors flex items-center gap-2">
                <Plus size={20} /> Salvar Produto
              </button>
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

      {/* Modal Entrada de Estoque */}
      {stockModal.isOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-100 bg-green-500 text-white">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <ArrowUpCircle size={20} /> Entrada de Estoque
              </h3>
            </div>
            
            <form onSubmit={handleStockEntry} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Produto</label>
                <div className="font-bold text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">{stockModal.productName}</div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade a Adicionar</label>
                <input 
                  type="number"
                  min="1"
                  required
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 font-bold text-xl"
                  value={stockModal.amount}
                  onChange={(e) => setStockModal(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setStockModal({ isOpen: false, productId: null, productName: '', amount: '1' })}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 shadow-md shadow-green-200 transition-all"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Excluir Produto"
        message="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        onCancel={() => setConfirmModal({ isOpen: false, productId: null })}
        confirmText="Excluir"
      />
    </div>
  );
}
