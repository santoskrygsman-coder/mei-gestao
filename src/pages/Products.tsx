import { useState, useEffect } from 'react';
import { Plus, Package, Trash2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  barcode: string;
  costPrice: number;
  salePrice: number;
  stock: number;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stock, setStock] = useState('');

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setProducts(await res.json());
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          barcode,
          costPrice,
          salePrice,
          stock
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        setName(''); setBarcode(''); setCostPrice(''); setSalePrice(''); setStock('');
        fetchProducts();
      }
    } catch (e) {
      alert("Erro ao salvar produto");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja apagar este produto?')) return;
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      await fetch(`${apiUrl}/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchProducts();
    } catch (e) {
      alert("Erro ao deletar produto");
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
          onClick={() => setIsModalOpen(true)}
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
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-semibold text-gray-600 text-sm">Produto</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Código</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Preço Custo</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Preço Venda</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Estoque</th>
                <th className="p-4 font-semibold text-gray-600 text-sm text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <Package className="mx-auto text-gray-300 mb-3" size={48} />
                    Nenhum produto cadastrado.
                  </td>
                </tr>
              ) : (
                products.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{p.name}</td>
                    <td className="p-4 text-gray-500 text-sm">{p.barcode || '-'}</td>
                    <td className="p-4 text-gray-600">R$ {p.costPrice.toFixed(2)}</td>
                    <td className="p-4 text-green-600 font-medium">R$ {p.salePrice.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {p.stock} un
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDelete(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Novo Produto</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
                <input required type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código (Barras/SKU)</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={barcode} onChange={e => setBarcode(e.target.value)} />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custo (R$)</label>
                  <input required type="number" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={costPrice} onChange={e => setCostPrice(e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venda (R$)</label>
                  <input required type="number" step="0.01" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={salePrice} onChange={e => setSalePrice(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade em Estoque</label>
                <input required type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={stock} onChange={e => setStock(e.target.value)} />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
