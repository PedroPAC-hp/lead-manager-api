import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { consultoresService, produtosService } from '../services/api';
import { 
  Users, Package, Upload, Send, TrendingUp, Loader2,
  Clock, CheckCircle, RefreshCw, ChevronRight, Target, FileSpreadsheet
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({ consultores: 0, produtos: 0 });
  const [consultores, setConsultores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lotes do localStorage
  const [lotes, setLotes] = useState([]);

  const cardStyle = {
    backgroundColor: darkMode ? '#1e293b' : '#ffffff',
    border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
    borderRadius: '12px',
  };

  useEffect(() => {
    loadStats();
    loadLotes();
  }, []);

  const loadLotes = () => {
    try {
      const saved = localStorage.getItem('leadmanager_lotes');
      if (saved) {
        setLotes(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Erro ao carregar lotes:', e);
    }
  };

  const loadStats = async () => {
    try {
      const [consultoresData, produtosData] = await Promise.all([
        consultoresService.list(),
        produtosService.list(),
      ]);
      setConsultores(consultoresData.filter(c => c.ativo));
      setStats({
        consultores: consultoresData.filter(c => c.ativo).length,
        produtos: produtosData.filter(p => p.ativo).length,
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

  // Calcular totais dos lotes
  const getTotaisLotes = () => {
    let processados = 0;
    let enviados = 0;
    lotes.forEach(lote => {
      const val = lote.validos || 0;
      if (lote.status === 'processado') processados += val;
      if (lote.status === 'enviado') enviados += val;
    });
    return { processados, enviados, total: lotes.length };
  };

  const totais = getTotaisLotes();

  const StatCard = ({ icon: Icon, label, value, gradient, subValue }) => (
    <div style={{ ...cardStyle, padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: '600', color: darkMode ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
            {label}
          </p>
          {loading ? (
            <Loader2 style={{ width: '20px', height: '20px', color: '#3b82f6', marginTop: '8px', animation: 'spin 1s linear infinite' }} />
          ) : (
            <>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#0f172a', margin: '4px 0 0 0' }}>{value}</p>
              {subValue && <p style={{ fontSize: '11px', color: darkMode ? '#64748b' : '#94a3b8', margin: '4px 0 0 0' }}>{subValue}</p>}
            </>
          )}
        </div>
        <div style={{ padding: '10px', borderRadius: '10px', background: `linear-gradient(135deg, ${gradient})` }}>
          <Icon style={{ width: '20px', height: '20px', color: '#ffffff' }} />
        </div>
      </div>
    </div>
  );

  const QuickActionCard = ({ icon: Icon, title, description, gradient, onClick }) => (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '10px',
      border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, backgroundColor: darkMode ? '#0f172a' : '#f8fafc',
      cursor: 'pointer', textAlign: 'left', width: '100%',
    }}>
      <div style={{ padding: '10px', borderRadius: '8px', background: `linear-gradient(135deg, ${gradient})` }}>
        <Icon style={{ width: '18px', height: '18px', color: '#ffffff' }} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: '600', fontSize: '13px', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>{title}</p>
        <p style={{ fontSize: '11px', color: darkMode ? '#64748b' : '#94a3b8', margin: '2px 0 0 0' }}>{description}</p>
      </div>
      <ChevronRight style={{ width: '16px', height: '16px', color: darkMode ? '#64748b' : '#94a3b8' }} />
    </button>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>
            {getGreeting()}, {user?.full_name?.split(' ')[0]}! 👋
          </h1>
          <p style={{ color: darkMode ? '#94a3b8' : '#64748b', marginTop: '4px', fontSize: '14px' }}>
            Aqui está o resumo do seu sistema de leads
          </p>
        </div>
        <button onClick={() => { loadStats(); loadLotes(); }} style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px',
          border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, backgroundColor: 'transparent',
          color: darkMode ? '#94a3b8' : '#64748b', fontSize: '13px', cursor: 'pointer',
        }}>
          <RefreshCw style={{ width: '14px', height: '14px' }} />
          Atualizar
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard icon={Users} label="Consultores Ativos" value={stats.consultores} gradient="#3b82f6, #2563eb" />
        <StatCard icon={Package} label="Produtos Ativos" value={stats.produtos} gradient="#22c55e, #16a34a" />
        <StatCard icon={Upload} label="Leads Processados" value={totais.processados} gradient="#a855f7, #9333ea" subValue={`${totais.total} lotes`} />
        <StatCard icon={Send} label="Leads Enviados" value={totais.enviados} gradient="#f59e0b, #d97706" />
      </div>

      {/* Linha 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Consultores Ativos */}
        <div style={cardStyle}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users style={{ width: '18px', height: '18px', color: '#3b82f6' }} />
              Consultores Ativos
            </h2>
            <span style={{ fontSize: '12px', color: darkMode ? '#64748b' : '#94a3b8' }}>{consultores.length} total</span>
          </div>
          <div style={{ padding: '12px', maxHeight: '240px', overflow: 'auto' }}>
            {consultores.length === 0 ? (
              <p style={{ textAlign: 'center', color: darkMode ? '#64748b' : '#94a3b8', padding: '20px', fontSize: '13px' }}>Nenhum consultor ativo</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {consultores.map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', backgroundColor: darkMode ? '#0f172a' : '#f8fafc' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600' }}>
                      {c.nome.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', fontWeight: '500', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>{c.nome}</p>
                      <p style={{ fontSize: '11px', color: darkMode ? '#64748b' : '#94a3b8', margin: 0 }}>{c.hora_inicio}h - {c.hora_fim}h</p>
                    </div>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '500', backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }}>Ativo</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ações Rápidas */}
        <div style={cardStyle}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>Ações Rápidas</h2>
          </div>
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <QuickActionCard icon={Upload} title="Upload de Leads" description="Carregar nova base" gradient="#a855f7, #9333ea" onClick={() => navigate('/upload')} />
            <QuickActionCard icon={Send} title="Enviar para Bitrix" description="Enviar lotes processados" gradient="#22c55e, #16a34a" onClick={() => navigate('/enviar')} />
            <QuickActionCard icon={Users} title="Gerenciar Consultores" description="Adicionar ou editar" gradient="#3b82f6, #2563eb" onClick={() => navigate('/consultores')} />
            <QuickActionCard icon={Package} title="Configurar Produtos" description="Filtros e associações" gradient="#f59e0b, #d97706" onClick={() => navigate('/produtos')} />
          </div>
        </div>
      </div>

      {/* Lotes Recentes */}
      <div style={cardStyle}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock style={{ width: '18px', height: '18px', color: '#a855f7' }} />
            Lotes Recentes
          </h2>
          <button onClick={() => navigate('/upload')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            + Novo Upload
          </button>
        </div>
        <div style={{ padding: '12px' }}>
          {lotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: darkMode ? '#64748b' : '#94a3b8' }}>
              <FileSpreadsheet style={{ width: '40px', height: '40px', margin: '0 auto', opacity: 0.5 }} />
              <p style={{ marginTop: '12px', fontSize: '13px' }}>Nenhum lote processado ainda</p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>Faça upload de uma base para começar</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {lotes.slice(0, 6).map((lote) => (
                <div key={lote.id} onClick={() => navigate('/enviar')} style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px',
                  backgroundColor: darkMode ? '#0f172a' : '#f8fafc', cursor: 'pointer',
                  border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '8px',
                    backgroundColor: lote.status === 'enviado' ? 'rgba(34, 197, 94, 0.2)' : lote.status === 'processado' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {lote.status === 'enviado' ? <CheckCircle style={{ width: '20px', height: '20px', color: '#22c55e' }} /> :
                     lote.status === 'processado' ? <Target style={{ width: '20px', height: '20px', color: '#3b82f6' }} /> :
                     <Clock style={{ width: '20px', height: '20px', color: '#f59e0b' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: '500', color: darkMode ? '#ffffff' : '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lote.arquivo || 'Sem nome'}
                    </p>
                    <p style={{ fontSize: '11px', color: darkMode ? '#64748b' : '#94a3b8', margin: '2px 0 0 0' }}>
                      {lote.produto_nome} • {lote.validos || lote.total_registros || 0} válidos
                    </p>
                  </div>
                  <span style={{
                    padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '500', textTransform: 'uppercase',
                    backgroundColor: lote.status === 'enviado' ? 'rgba(34, 197, 94, 0.2)' : lote.status === 'processado' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: lote.status === 'enviado' ? '#22c55e' : lote.status === 'processado' ? '#3b82f6' : '#f59e0b',
                  }}>
                    {lote.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alerta de lotes pendentes */}
      {lotes.filter(l => l.status === 'processado').length > 0 && (
        <div style={{
          marginTop: '20px', padding: '16px 20px', borderRadius: '12px',
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          display: 'flex', alignItems: 'center', gap: '16px',
        }}>
          <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <TrendingUp style={{ width: '24px', height: '24px', color: '#ffffff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontWeight: '600', fontSize: '14px', color: '#ffffff', margin: 0 }}>Lotes Aguardando Envio</h3>
            <p style={{ fontSize: '13px', color: '#bfdbfe', margin: '4px 0 0 0' }}>
              Você tem {lotes.filter(l => l.status === 'processado').length} lote(s) prontos para enviar ao Bitrix24.
            </p>
          </div>
          <button onClick={() => navigate('/enviar')} style={{
            padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: 'rgba(255,255,255,0.2)',
            color: '#ffffff', fontSize: '13px', fontWeight: '500', cursor: 'pointer',
          }}>
            Enviar Agora →
          </button>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
