import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check, Save } from 'lucide-react';
import { FeedbackModal } from '../components/FeedbackModal';
import { ConfirmModal } from '../components/ConfirmModal';

interface Category {
  id: string;
  name: string;
  type: 'PRODUCT' | 'TRANSACTION';
  color?: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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

  const showModal = (type: 'success' | 'error' | 'info', title: string, message: string | React.ReactNode) => {
    setModalState({ isOpen: true, type, title, message });
  };
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    categoryId: string | null;
  }>({
    isOpen: false,
    categoryId: null
  });
  const [formData, setFormData] = useState({
    name: '',
    type: 'PRODUCT',
    color: '#3B82F6',
  });

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setCategories(await res.json());
      } else {
        throw new Error('Failed to fetch');
      }
    } catch (error) {
      showModal('error', 'Erro', 'Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        type: category.type,
        color: category.color || '#3B82F6',
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        type: 'PRODUCT',
        color: '#3B82F6',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      let res;
      if (editingCategory) {
        res = await fetch(`${apiUrl}/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(formData)
        });
      } else {
        res = await fetch(`${apiUrl}/api/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(formData)
        });
      }
      
      if (!res.ok) throw new Error('Failed to save');
      
      if (editingCategory) {
        showModal('success', 'Sucesso', 'Categoria atualizada!');
      } else {
        showModal('success', 'Sucesso', 'Categoria criada!');
      }
      fetchCategories();
      closeModal();
    } catch (error) {
      showModal('error', 'Erro', 'Erro ao salvar categoria');
    }
  };

  const requestDelete = (id: string) => {
    setConfirmModal({ isOpen: true, categoryId: id });
  };

  const handleDelete = async () => {
    if (!confirmModal.categoryId) return;
    const id = confirmModal.categoryId;
    setConfirmModal({ isOpen: false, categoryId: null });
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to delete');
      
      showModal('success', 'Sucesso', 'Categoria excluída!');
      fetchCategories();
    } catch (error) {
      showModal('error', 'Erro', 'Erro ao excluir categoria');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  const productsCategories = categories.filter(c => c.type === 'PRODUCT');
  const transactionCategories = categories.filter(c => c.type === 'TRANSACTION');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categorias</h1>
        <button
          onClick={() => openModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Categoria
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Produtos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Categorias de Produtos</h2>
          <div className="space-y-3">
            {productsCategories.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma categoria cadastrada.</p>
            ) : (
              productsCategories.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color || '#3B82F6' }}></div>
                    <span className="text-gray-900 dark:text-white font-medium">{c.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openModal(c)} className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => requestDelete(c.id)} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Transações */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Categorias Financeiras</h2>
          <div className="space-y-3">
            {transactionCategories.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma categoria cadastrada.</p>
            ) : (
              transactionCategories.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color || '#10B981' }}></div>
                    <span className="text-gray-900 dark:text-white font-medium">{c.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openModal(c)} className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => requestDelete(c.id)} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-900 dark:text-white"
                  placeholder="Ex: Eletrônicos, Despesas Fixas..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'PRODUCT' | 'TRANSACTION' })}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-900 dark:text-white"
                >
                  <option value="PRODUCT">Produto (Estoque)</option>
                  <option value="TRANSACTION">Financeiro (Receitas/Despesas)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cor de Identificação
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer border-0 p-0"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Escolha uma cor para os gráficos</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Salvar
                </button>
              </div>
            </form>
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
        title="Excluir Categoria"
        message="Deseja realmente excluir esta categoria? Histórico anterior usando o nome será mantido, mas não aparecerá nas opções."
        onConfirm={handleDelete}
        onCancel={() => setConfirmModal({ isOpen: false, categoryId: null })}
        confirmText="Excluir"
      />
    </div>
  );
}
