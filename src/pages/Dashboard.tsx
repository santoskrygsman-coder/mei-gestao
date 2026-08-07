
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('mei_token');
  const userStr = localStorage.getItem('mei_user');
  
  if (!token || !userStr) {
    // Redireciona se não estiver logado
    setTimeout(() => navigate('/'), 100);
    return null;
  }

  const user = JSON.parse(userStr);

  const handleLogout = () => {
    localStorage.removeItem('mei_token');
    localStorage.removeItem('mei_user');
    navigate('/');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Painel SaaS MEI</h1>
          <p style={{ color: 'var(--text-muted)' }}>Bem-vindo de volta, {user.name}!</p>
        </div>
        <button className="btn btn-outline" onClick={handleLogout}>Sair</button>
      </header>

      <div className="card">
        <h3>Visão Geral</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Seu ID de Empresa (Tenant): {user.companyId}</p>
        
        <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Faturamento do Mês</h4>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>R$ 0,00</p>
          </div>
          <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Vendas Realizadas</h4>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
