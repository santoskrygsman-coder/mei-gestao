import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer login.');
      }
      
      localStorage.setItem('mei_token', data.token);
      localStorage.setItem('mei_user', JSON.stringify(data.user));
      setSuccess('Login realizado! Redirecionando...');
      setTimeout(() => window.location.href = '/dashboard', 1000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans text-gray-900">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 mx-auto mb-4">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">MEI Gestão</h1>
          <p className="text-gray-500 text-sm">Acesse sua conta para continuar</p>
        </div>
        
        {error && <div className="mb-4 text-center text-red-600 bg-red-50 py-2 rounded-lg text-sm font-medium border border-red-100">{error}</div>}
        {success && <div className="mb-4 text-center text-green-600 bg-green-50 py-2 rounded-lg text-sm font-medium border border-green-100">{success}</div>}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">E-mail</label>
            <input 
              id="email"
              type="email" 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-sm" 
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Senha</label>
            <input 
              id="password"
              type="password" 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-sm" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-0.5">
            Entrar no Sistema
          </button>
        </form>

        <div className="text-center mt-8 text-sm">
          <span className="text-gray-500">Não tem uma conta? </span>
          <Link to="/register" className="text-blue-600 font-bold hover:text-blue-800 transition-colors">
            Criar conta grátis
          </Link>
        </div>
      </div>
    </div>
  );
}
