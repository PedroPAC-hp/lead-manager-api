import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { estatisticasService, consultoresService } from '../services/api';
import { Users, Package, Upload, Send, TrendingUp, Loader2, Clock, CheckCircle, RefreshCw, ChevronRight, Target, FileSpreadsheet, Settings, BarChart3, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [grafico, setGrafico] = useState(null);
  const [consultores, setConsultores] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [error, setError] = useState(null);

  const cardStyle = { backgroundColor: darkMode ? '#1e293b' : '#ffffff', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '12px' };

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashData, graficoData, lotesData, consultoresData] = await Promise.all([
        estatisticasService.getDashboard(),
        estatisticasService.getGraficoSemanal(),
        estatisticasService.getLotes(0, 5),
        consultoresService.list(true)
      ]);
      setStats(dashData);
      setGrafico(graficoData);
      setLotes(lotesData.lotes || []);
      setConsultores(consultoresData || []);
    } catch (e) {
      console.error('Erro ao carregar dashboard:', e);
      setError('Erro ao carregar dados. Verifique se o backend está rodando.');
    }
    setLoading(false);
  };

  const getGreeting = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };

  const StatCard = ({ icon: Icon, label, value, gradient, sub }) => (
    <div style={{ ...cardStyle, padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '10px', fontWeight: '600', color: darkMode ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>{label}</p>
          {loading ? <Loader2 style={{ width: '18px', height: '18px', color: '#3b82f6', marginTop: '6px', animation: 'spin 1s linear infinite' }} /> : (
            <><p style={{ fontSize: '24px', fontWeight: 'bold', color: darkMode ? '#fff' : '#0f172a', margin: '2px 0 0 0' }}>{value}</p>
            {sub && <p style={{ fontSize: '10px', color: darkMode ? '#64748b' : '#94a3b8', margin: '2px 0 0 0' }}>{sub}</p>}</>
          )}
        </div>
        <div style={{ padding: '8px', borderRadius: '8px', background: `linear-gradient(135deg, ${gradient})` }}><Icon style={{ width: '18px', height: '18px', color: '#fff' }} /></div>
      </div>
    </div>
  );

  const QuickAction = ({ icon: Icon, title, desc, gradient, onClick }) => (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '8px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, backgroundColor: darkMode ? '#0f172a' : '#f8fafc', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
      <div style={{ padding: '8px', borderRadius: '8px', background: `linear-gradient(135deg, ${gradient})` }}><Icon style={{ width: '16px', height: '16px', color: '#fff' }} /></div>
      <div style={{ flex: 1 }}><p style={{ fontWeight: '600', fontSize: '12px', color: darkMode ? '#fff' : '#0f172a', margin: 0 }}>{title}</p><p style={{ fontSize: '10px', color: darkMode ? '#64748b' : '#94a3b8', margin: '2px 0 0 0' }}>{desc}</p></div>
      <ChevronRight style={{ width: '14px', height: '14px', color: darkMode ? '#64748b' : '#94a3b8' }} />
    </button>
  );

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', gap: '16px' }}>
        <AlertCircle style={{ width: '48px', height: '48px', color: '#ef4444' }} />
        <p style={{ color: darkMode ? '#fff' : '#0f172a', fontSize: '16px' }}>{error}</p>
        <button onClick={loadAll} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', cursor: 'pointer' }}>Tentar Novamente</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: darkMode ? '#fff' : '#0f172a', margin: 0 }}>{getGreeting()}, {user?.full_name?.split(' ')[0]}! 👋</h1>
          <p style={{ color: darkMode ? '#94a3b8' : '#64748b', marginTop: '4px', fontSize: '13px' }}>Dados em tempo real do sistema</p>
        </div>
        <button onClick={loadAll} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, backgroundColor: 'transparent', color: darkMode ? '#94a3b8' : '#64748b', fontSize: '12px', cursor: 'pointer' }}>
          <RefreshCw style={{ width: '14px', height: '14px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />Atualizar
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <StatCard icon={Users} label="Consultores" value={stats?.consultores_ativos || 0} gradient="#3b82f6, #2563eb" />
        <StatCard icon={Package} label="Produtos" value={stats?.produtos_ativos || 0} gradient="#22c55e, #16a34a" />
        <StatCard icon={Send} label="Leads Enviados" value={stats?.total_leads_enviados || 0} gradient="#a855f7, #9333ea" sub={`${stats?.leads_hoje || 0} hoje`} />
        <StatCard icon={Target} label="Aguardando Envio" value={stats?.leads_aguardando_envio || 0} gradient="#f59e0b, #d97706" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '20px' }}>
        {/* Gráfico */}
        <div style={cardStyle}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#fff' : '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><BarChart3 style={{ width: '16px', height: '16px', color: '#3b82f6' }} />Performance Semanal</h2>
            <span style={{ fontSize: '11px', color: darkMode ? '#64748b' : '#94a3b8' }}>Dados reais</span>
          </div>
          <div style={{ padding: '16px' }}>
            {loading || !grafico ? (
              <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 style={{ width: '24px', height: '24px', color: '#3b82f6', animation: 'spin 1s linear infinite' }} /></div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px', paddingTop: '20px' }}>
                  {grafico.dias?.map((d, i) => {
                    const maxVal = Math.max(...grafico.dias.map(x => x.leads), 1);
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        {d.leads > 0 && <span style={{ fontSize: '10px', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '500' }}>{d.leads}</span>}
                        <div style={{ width: '100%', height: `${Math.max((d.leads / maxVal) * 80, 4)}px`, borderRadius: '4px 4px 0 0', background: d.is_hoje ? 'linear-gradient(180deg, #3b82f6, #2563eb)' : (darkMode ? '#334155' : '#e2e8f0'), transition: 'height 0.3s' }} />
                        <span style={{ fontSize: '10px', color: d.is_hoje ? '#3b82f6' : (darkMode ? '#64748b' : '#94a3b8'), fontWeight: d.is_hoje ? '600' : '400' }}>{d.dia_semana}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
                  <div style={{ textAlign: 'center' }}><p style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6', margin: 0 }}>{grafico.total_semana}</p><p style={{ fontSize: '10px', color: darkMode ? '#64748b' : '#94a3b8', margin: 0 }}>Total Semana</p></div>
                  <div style={{ textAlign: 'center' }}><p style={{ fontSize: '18px', fontWeight: 'bold', color: '#22c55e', margin: 0 }}>{grafico.media_diaria}</p><p style={{ fontSize: '10px', color: darkMode ? '#64748b' : '#94a3b8', margin: 0 }}>Média/Dia</p></div>
                  <div style={{ textAlign: 'center' }}><p style={{ fontSize: '18px', fontWeight: 'bold', color: '#a855f7', margin: 0 }}>{stats?.lotes_enviados || 0}</p><p style={{ fontSize: '10px', color: darkMode ? '#64748b' : '#94a3b8', margin: 0 }}>Lotes Enviados</p></div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Ações Rápidas */}
        <div style={cardStyle}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}><h2 style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#fff' : '#0f172a', margin: 0 }}>Ações Rápidas</h2></div>
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <QuickAction icon={Upload} title="Upload" desc="Nova base" gradient="#a855f7, #9333ea" onClick={() => navigate('/upload')} />
            <QuickAction icon={Send} title="Enviar" desc="Para Bitrix" gradient="#22c55e, #16a34a" onClick={() => navigate('/enviar')} />
            <QuickAction icon={Users} title="Consultores" desc="Gerenciar" gradient="#3b82f6, #2563eb" onClick={() => navigate('/consultores')} />
            <QuickAction icon={Settings} title="Configurações" desc="Sistema" gradient="#64748b, #475569" onClick={() => navigate('/configuracoes')} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Consultores */}
        <div style={cardStyle}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#fff' : '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Users style={{ width: '16px', height: '16px', color: '#3b82f6' }} />Consultores Ativos</h2>
            <span style={{ fontSize: '11px', color: darkMode ? '#64748b' : '#94a3b8' }}>{consultores.length}</span>
          </div>
          <div style={{ padding: '10px', maxHeight: '200px', overflow: 'auto' }}>
            {consultores.length === 0 ? <p style={{ textAlign: 'center', color: darkMode ? '#64748b' : '#94a3b8', padding: '20px', fontSize: '12px' }}>Nenhum consultor</p> : consultores.slice(0, 5).map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '6px', backgroundColor: darkMode ? '#0f172a' : '#f8fafc', marginBottom: '6px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600' }}>{c.nome.charAt(0)}</div>
                <div style={{ flex: 1 }}><p style={{ fontSize: '12px', fontWeight: '500', color: darkMode ? '#fff' : '#0f172a', margin: 0 }}>{c.nome}</p><p style={{ fontSize: '10px', color: darkMode ? '#64748b' : '#94a3b8', margin: 0 }}>{c.hora_inicio}h - {c.hora_fim}h</p></div>
                <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '500', backgroundColor: 'rgba(34,197,94,0.2)', color: '#22c55e' }}>Ativo</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lotes Recentes */}
        <div style={cardStyle}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#fff' : '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Clock style={{ width: '16px', height: '16px', color: '#a855f7' }} />Lotes Recentes</h2>
            <button onClick={() => navigate('/upload')} style={{ padding: '4px 10px', borderRadius: '4px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontSize: '10px', cursor: 'pointer' }}>+ Novo</button>
          </div>
          <div style={{ padding: '10px', maxHeight: '200px', overflow: 'auto' }}>
            {lotes.length === 0 ? <div style={{ textAlign: 'center', padding: '20px', color: darkMode ? '#64748b' : '#94a3b8' }}><FileSpreadsheet style={{ width: '32px', height: '32px', margin: '0 auto', opacity: 0.5 }} /><p style={{ marginTop: '8px', fontSize: '12px' }}>Nenhum lote</p></div> : lotes.map(l => (
              <div key={l.id} onClick={() => navigate('/enviar')} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '6px', backgroundColor: darkMode ? '#0f172a' : '#f8fafc', cursor: 'pointer', marginBottom: '6px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: l.status === 'enviado' ? 'rgba(34,197,94,0.2)' : l.status === 'processado' ? 'rgba(59,130,246,0.2)' : 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {l.status === 'enviado' ? <CheckCircle style={{ width: '16px', height: '16px', color: '#22c55e' }} /> : l.status === 'processado' ? <Target style={{ width: '16px', height: '16px', color: '#3b82f6' }} /> : <Clock style={{ width: '16px', height: '16px', color: '#f59e0b' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}><p style={{ fontSize: '12px', fontWeight: '500', color: darkMode ? '#fff' : '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.nome || l.arquivo || 'Sem nome'}</p><p style={{ fontSize: '10px', color: darkMode ? '#64748b' : '#94a3b8', margin: 0 }}>{l.produto_nome} • {l.validos || 0} válidos</p></div>
                <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '500', textTransform: 'uppercase', backgroundColor: l.status === 'enviado' ? 'rgba(34,197,94,0.2)' : l.status === 'processado' ? 'rgba(59,130,246,0.2)' : 'rgba(245,158,11,0.2)', color: l.status === 'enviado' ? '#22c55e' : l.status === 'processado' ? '#3b82f6' : '#f59e0b' }}>{l.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {stats?.leads_aguardando_envio > 0 && (
        <div style={{ marginTop: '16px', padding: '14px 18px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.2)' }}><TrendingUp style={{ width: '20px', height: '20px', color: '#fff' }} /></div>
          <div style={{ flex: 1 }}><h3 style={{ fontWeight: '600', fontSize: '13px', color: '#fff', margin: 0 }}>Leads Aguardando</h3><p style={{ fontSize: '12px', color: '#bfdbfe', margin: '2px 0 0 0' }}>{stats.leads_aguardando_envio} leads prontos para enviar</p></div>
          <button onClick={() => navigate('/enviar')} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>Enviar →</button>
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}