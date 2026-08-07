import { Link } from 'react-router-dom';
import { Shield, Zap, BarChart3, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white font-sans text-gray-900">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <span className="font-bold text-2xl tracking-tight text-gray-900">MEI Gestão</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Entrar</Link>
          <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
            Testar Grátis
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-medium text-sm mb-8 border border-blue-200">
          <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
          O sistema definitivo para o MEI moderno
        </div>
        <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 tracking-tight mb-8 leading-tight">
          Sua empresa na palma <br className="hidden lg:block" /> da sua mão, sem complicação.
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
          Esqueça as planilhas e o caderno. Controle seu estoque, faça vendas com nosso PDV rápido e gerencie seus clientes em um único lugar. Tudo na nuvem.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link to="/register" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-blue-200 hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center gap-2">
            Começar Agora <ChevronRight size={20} />
          </Link>
          <a href="#features" className="w-full sm:w-auto bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center">
            Ver Funcionalidades
          </a>
        </div>

        <div className="mt-12 flex justify-center items-center gap-8 text-sm text-gray-500 font-medium">
          <div className="flex items-center gap-2"><CheckCircle2 className="text-green-500" size={18} /> Sem cartão de crédito</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="text-green-500" size={18} /> Cancelamento grátis</div>
        </div>
      </main>

      {/* Features Preview */}
      <section id="features" className="bg-white py-24 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Tudo que o seu negócio precisa</h2>
            <p className="text-gray-500 text-lg">Criado especificamente para as necessidades do Microempreendedor Individual.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Dashboard Financeiro</h3>
              <p className="text-gray-600 leading-relaxed">
                Acompanhe o coração do seu negócio. Saiba exatamente o quanto entrou, saiu e o seu lucro líquido do mês em gráficos intuitivos.
              </p>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
                <Zap size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Frente de Caixa (PDV)</h3>
              <p className="text-gray-600 leading-relaxed">
                Venda em segundos! Interface inspirada em supermercados modernos. Clicou, vendeu, o dinheiro já vai direto para o caixa.
              </p>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Shield size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Controle de Estoque</h3>
              <p className="text-gray-600 leading-relaxed">
                O adeus final à contagem manual. Cada venda no sistema dá baixa automática no estoque, com alertas para itens acabando.
              </p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Gestão de Clientes</h3>
              <p className="text-gray-600 leading-relaxed">
                Um CRM básico e poderoso. Cadastre clientes, telefone e CPF para fidelizar seu público e manter histórico de vendas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 text-center text-gray-400">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-50 grayscale">
          <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
            <span className="text-gray-900 font-bold text-xs">M</span>
          </div>
          <span className="font-bold tracking-tight text-white">MEI Gestão</span>
        </div>
        <p>&copy; {new Date().getFullYear()} MEI Gestão SaaS. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
