import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { consultoresService, produtosService } from '../services/api';
import { Users, Package, Upload, Send, TrendingUp } from 'lucide-react';
import Loading from '../components/ui/Loading';

function StatCard({ icon: Icon, label, value, color, loading }) {
  const colors = {
    blue: 'from-primary-500 to-primary-700',
    green: 'from-green-500 to-green-700',
    purple: 'from-purple-500 to-purple-700',
    orange: 'from-orange-500 to-orange-700',
  };

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-dark-500 dark:text-dark-400 text-sm font-medium">
            {label}
          </p>
          {loading ? (
            <div className="mt-2">
              <Loading size="sm" />
            </div>
          ) : (
            <p className="text-3xl font-bold text-dark-900 dark:text-white mt-1">
              {value}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colors[color]} shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ icon: Icon, title, description, color, onClick }) {
  const colors = {
    primary: 'hover:border-primary-500 dark:hover:border-primary-500 bg-primary-50 dark:bg-primary-900/20 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 text-primary-600',
    green: 'hover:border-green-500 dark:hover:border-green-500 bg-green-50 dark:bg-green-900/20 group-hover:bg-green-100 dark:group-hover:bg-green-900/30 text-green-600',
    purple: 'hover:border-purple-500 dark:hover:border-purple-500 bg-purple-50 dark:bg-purple-900/20 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 text-purple-600',
  };

  const [borderColor, bgColor] = colors[color].split(' bg-');

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 p-4 rounded-xl border-2 border-dashed 
                 border-dark-200 dark:border-dark-700 ${borderColor}
                 transition-colors group text-left w-full`}
    >
      <div className={`p-3 rounded-lg bg-${bgColor} transition-colors`}>
        <Icon className={`w-6 h-6 ${colors[color].split(' ').pop()}`} />
      </div>
      <div>
        <p className="font-medium text-dark-900 dark:text-white">
          {title}
        </p>
        <p className="text-sm text-dark-500 dark:text-dark-400">
          {description}
        </p>
      </div>
    </button>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    consultores: 0,
    produtos: 0,
    leadsHoje: 0,
    leadsEnviados: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [consultores, produtos] = await Promise.all([
        consultoresService.list(),
        produtosService.list(),
      ]);

      setStats({
        consultores: consultores.length,
        produtos: produtos.length,
        leadsHoje: '-',
        leadsEnviados: '-',
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
          {getGreeting()}, {user?.full_name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-dark-500 dark:text-dark-400 mt-1">
          Aqui está o resumo do seu sistema de leads
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Consultores Ativos"
          value={stats.consultores}
          color="blue"
          loading={loading}
        />
        <StatCard
          icon={Package}
          label="Produtos Configurados"
          value={stats.produtos}
          color="green"
          loading={loading}
        />
        <StatCard
          icon={Upload}
          label="Leads Hoje"
          value={stats.leadsHoje}
          color="purple"
          loading={loading}
        />
        <StatCard
          icon={Send}
          label="Leads Enviados"
          value={stats.leadsEnviados}
          color="orange"
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard
            icon={Upload}
            title="Upload de Leads"
            description="Carregar nova base"
            color="primary"
            onClick={() => navigate('/upload')}
          />
          <QuickActionCard
            icon={Users}
            title="Gerenciar Consultores"
            description="Adicionar ou editar"
            color="green"
            onClick={() => navigate('/consultores')}
          />
          <QuickActionCard
            icon={Package}
            title="Configurar Produtos"
            description="Pós, Tec, Profissionalizante"
            color="purple"
            onClick={() => navigate('/produtos')}
          />
        </div>
      </div>

      {/* Info Card */}
      <div className="card p-6 bg-gradient-to-r from-primary-500 to-primary-700">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-white/20">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <div className="text-white">
            <h3 className="font-semibold text-lg">Sistema Pronto!</h3>
            <p className="text-primary-100">
              Sua API está funcionando e conectada ao Bitrix24. 
              Comece fazendo upload de uma base de leads.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}