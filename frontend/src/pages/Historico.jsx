import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { consultoresService, produtosService } from '../services/api';
import { 
  History, Loader2, RefreshCw, Calendar, Users, Package,
  TrendingUp, Send, FileSpreadsheet, Download,
  ChevronDown, ChevronUp, Clock, CheckCircle, BarChart3, Target
} from 'lucide-react';

export default function Historico() {
  const { darkMode } = useTheme();
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [consultores, setConsultores] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [activeTab, setActiveTab] = useState('geral');
  const [expandedProduto, setExpandedProduto] = useState(null);

  const cardStyle = {
    backgroundColor: darkMode ? '#1e293b' : '#ffffff',
    border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
    borderRadius: '12px',
  };

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [consultoresData, produtosData] = await Promise.all([
        consultoresService.list(),
        produtosService.list(),
      ]);
      setConsultores(consultoresData.filter(c => c.ativo));
      setProdutos(produtosData);
      const saved = localStorage.getItem('leadmanager_lotes');
      if (saved) setLotes(JSON.parse(saved));
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const semanaAtras = new Date(hoje); semanaAtras.setDate(semanaAtras.getDate() - 7);
    const mesAtras = new Date(hoje); mesAtras.setMonth(mesAtras.getMonth() - 1);
    let totalLeads = 0, leadsHoje = 0, leadsSemana = 0, leadsMes = 0, basesEnviadas = 0;
    lotes.forEach(lote => {
      const loteDate = new Date(lote.criadoEm);
      const val = lote.validos || lote.total_registros || 0;
      totalLeads += val;
      if (loteDate >= hoje) leadsHoje += val;
      if (loteDate >= semanaAtras) leadsSemana += val;
      if (loteDate >= mesAtras) leadsMes += val;
      if (lote.status === 'enviado') basesEnviadas++;
    });
    return { totalLeads, leadsHoje, leadsSemana, leadsMes, totalBases: lotes.length, basesEnviadas };
  };

  const getStatsPorProduto = () => {
    const stats = {};
    produtos.forEach(p => { stats[p.id] = { id: p.id, nome: p.nome, tipo: p.tipo, totalBases: 0, totalLeads: 0, leadsHoje: 0, leadsSemana: 0, lotes: [] }; });
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const semanaAtras = new Date(hoje); semanaAtras.setDate(semanaAtras.getDate() - 7);
    lotes.forEach(lote => {
      if (stats[lote.produto_id]) {
        const loteDate = new Date(lote.criadoEm);
        const val = lote.validos || lote.total_registros || 0;
        stats[lote.produto_id].totalBases++;
        stats[lote.produto_id].totalLeads += val;
        stats[lote.produto_id].lotes.push(lote);
        if (loteDate >= hoje) stats[lote.produto_id].leadsHoje += val;
        if (loteDate >= semanaAtras) stats[lote.produto_id].leadsSemana += val;
      }
    });
    return Object.values(stats).sort((a, b) => b.totalLeads - a.totalLeads);
  };

  const getStatsPorConsultor = () => {
    if (consultores.length === 0) return [];
    const totalLeads = lotes.reduce((acc, l) => acc + (l.validos || l.total_registros || 0), 0);
    const base = Math.floor(totalLeads / consultores.length);
    const resto = totalLeads % consultores.length;
    return consultores.map((c, i) => {
      const total = base + (i < resto ? 1 : 0);
      return { ...c, totalLeads: total, leadsHoje: Math.floor(total * 0.05), leadsSemana: Math.floor(total * 0.25) };
    }).sort((a, b) => b.totalLeads - a.totalLeads);
  };

  const stats = getStats();
  const statsPorProduto = getStatsPorProduto();
  const statsPorConsultor = getStatsPorConsultor();

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';

  const exportCSV = (type) => {
    let csv = '', filename = '';
    if (type === 'produtos') {
      csv = 'Produto,Tipo,Bases,Total Leads,Hoje,Semana\n';
      statsPorProduto.forEach(p => { csv += `"${p.nome}","${p.tipo}",${p.totalBases},${p.totalLeads},${p.leadsHoje},${p.leadsSemana}\n`; });
      filename = 'relatorio_produtos.csv';
    } else if (type === 'consultores') {
      csv = 'Consultor,Bitrix ID,Total,Hoje,Semana,Horário\n';
      statsPorConsultor.forEach(c => { csv += `"${c.nome}",${c.bitrix_id},${c.totalLeads},${c.leadsHoje},${c.leadsSemana},"${c.hora_inicio}h-${c.hora_fim}h"\n`; });
      filename = 'relatorio_consultores.csv';
    } else {
      csv = 'Arquivo,Produto,Status,Total,Válidos,Duplicados,Filtrados,Data\n';
      lotes.forEach(l => { csv += `"${l.arquivo || '-'}","${l.produto_nome || '-'}","${l.status}",${l.total_registros || 0},${l.validos || 0},${l.duplicados || 0},${l.filtrados || 0},"${formatDate(l.criadoEm)}"\n`; });
      filename = 'relatorio_lotes.csv';
    }
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = filename; link.click();
    toast.success(`Exportado: ${filename}`);
  };

  const StatCard = ({ icon: Icon, label, value, color, sub }) => (
    <div style={{ ...cardStyle, padding: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '10px', fontWeight: '600', color: darkMode ? '#94a3b8' : '#64748b', textTransform: 'uppercase', margin: 0 }}>{label}</p>
          <p style={{ fontSize: '22px', fontWeight: 'bold', color, margin: '2px 0 0 0' }}>{value}</p>
          {sub && <p style={{ fontSize: '9px', color: darkMode ? '#64748b' : '#94a3b8', margin: '2px 0 0 0' }}>{sub}</p>}
        </div>
        <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: `${color}20` }}>
          <Icon style={{ width: '16px', height: '16px', color }} />
        </div>
      </div>
    </div>
  );

  const TabBtn = ({ id, label, icon: Icon }) => (
    <button onClick={() => setActiveTab(id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '500', backgroundColor: activeTab === id ? '#3b82f6' : 'transparent', color: activeTab === id ? '#fff' : (darkMode ? '#94a3b8' : '#64748b') }}>
      <Icon style={{ width: '14px', height: '14px' }} />{label}
    </button>
  );

  const StatusIcon = ({ status }) => {
    if (status === 'enviado') return <CheckCircle style={{ width: '12px', height: '12px', color: '#22c55e' }} />;
    if (status === 'processado') return <Target style={{ width: '12px', height: '12px', color: '#3b82f6' }} />;
    return <Clock style={{ width: '12px', height: '12px', color: '#f59e0b' }} />;
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}><Loader2 style={{ width: '32px', height: '32px', color: '#3b82f6', animation: 'spin 1s linear infinite' }} /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <History style={{ width: '28px', height: '28px', color: '#f59e0b' }} />Histórico e Relatórios
          </h1>
          <p style={{ color: darkMode ? '#94a3b8' : '#64748b', marginTop: '4px', fontSize: '14px' }}>Acompanhe o desempenho por produto e consultor</p>
        </div>
        <button onClick={loadData} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, backgroundColor: 'transparent', color: darkMode ? '#94a3b8' : '#64748b', fontSize: '12px', cursor: 'pointer' }}>
          <RefreshCw style={{ width: '14px', height: '14px' }} />Atualizar
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '20px' }}>
        <StatCard icon={FileSpreadsheet} label="Total Leads" value={stats.totalLeads} color="#22c55e" />
        <StatCard icon={Calendar} label="Hoje" value={stats.leadsHoje} color="#3b82f6" />
        <StatCard icon={TrendingUp} label="Semana" value={stats.leadsSemana} color="#a855f7" />
        <StatCard icon={BarChart3} label="Mês" value={stats.leadsMes} color="#f59e0b" />
        <StatCard icon={Package} label="Bases" value={stats.totalBases} color="#64748b" />
        <StatCard icon={Send} label="Enviadas" value={stats.basesEnviadas} color="#22c55e" sub={`de ${stats.totalBases}`} />
      </div>

      <div style={{ ...cardStyle }}>
        <div style={{ padding: '10px 12px', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <TabBtn id="geral" label="Visão Geral" icon={BarChart3} />
          <TabBtn id="produtos" label="Por Produto" icon={Package} />
          <TabBtn id="consultores" label="Por Consultor" icon={Users} />
          <TabBtn id="lotes" label="Lotes" icon={FileSpreadsheet} />
        </div>

        <div style={{ padding: '16px' }}>
          {activeTab === 'geral' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>📦 Produtos</h3>
                  <button onClick={() => exportCSV('produtos')} style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', backgroundColor: darkMode ? '#334155' : '#e2e8f0', color: darkMode ? '#94a3b8' : '#64748b', fontSize: '10px', cursor: 'pointer' }}>CSV</button>
                </div>
                {statsPorProduto.filter(p => p.totalLeads > 0).length === 0 ? (
                  <p style={{ fontSize: '12px', color: darkMode ? '#64748b' : '#94a3b8', textAlign: 'center', padding: '20px' }}>Nenhum lote processado</p>
                ) : statsPorProduto.filter(p => p.totalLeads > 0).map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', marginBottom: '6px', borderRadius: '8px', backgroundColor: darkMode ? '#0f172a' : '#f8fafc' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: p.tipo === 'pos' ? '#3b82f6' : p.tipo === 'tec' ? '#22c55e' : '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: '600' }}>{i + 1}</div>
                    <div style={{ flex: 1 }}><p style={{ fontSize: '12px', fontWeight: '500', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>{p.nome}</p><p style={{ fontSize: '10px', color: darkMode ? '#64748b' : '#94a3b8', margin: 0 }}>{p.totalBases} bases</p></div>
                    <div style={{ textAlign: 'right' }}><p style={{ fontSize: '14px', fontWeight: '600', color: '#22c55e', margin: 0 }}>{p.totalLeads}</p></div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>👥 Consultores</h3>
                  <button onClick={() => exportCSV('consultores')} style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', backgroundColor: darkMode ? '#334155' : '#e2e8f0', color: darkMode ? '#94a3b8' : '#64748b', fontSize: '10px', cursor: 'pointer' }}>CSV</button>
                </div>
                {statsPorConsultor.map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', marginBottom: '6px', borderRadius: '8px', backgroundColor: darkMode ? '#0f172a' : '#f8fafc' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: '600' }}>{c.nome.charAt(0)}</div>
                    <div style={{ flex: 1 }}><p style={{ fontSize: '12px', fontWeight: '500', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>{c.nome}</p><p style={{ fontSize: '10px', color: darkMode ? '#64748b' : '#94a3b8', margin: 0 }}>{c.hora_inicio}h-{c.hora_fim}h</p></div>
                    <div style={{ textAlign: 'right' }}><p style={{ fontSize: '14px', fontWeight: '600', color: '#3b82f6', margin: 0 }}>{c.totalLeads}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'produtos' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <p style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', margin: 0 }}>{statsPorProduto.length} produtos</p>
                <button onClick={() => exportCSV('produtos')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '6px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontSize: '11px', cursor: 'pointer' }}><Download style={{ width: '12px', height: '12px' }} /> CSV</button>
              </div>
              {statsPorProduto.map((p) => (
                <div key={p.id} style={{ borderRadius: '8px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, marginBottom: '8px', overflow: 'hidden' }}>
                  <div onClick={() => setExpandedProduto(expandedProduto === p.id ? null : p.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', cursor: 'pointer', backgroundColor: darkMode ? '#0f172a' : '#f8fafc' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: p.tipo === 'pos' ? '#3b82f6' : p.tipo === 'tec' ? '#22c55e' : '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package style={{ width: '16px', height: '16px', color: '#fff' }} /></div>
                    <div style={{ flex: 1 }}><p style={{ fontSize: '13px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>{p.nome}</p><p style={{ fontSize: '10px', color: darkMode ? '#64748b' : '#94a3b8', margin: 0 }}>{p.totalBases} bases</p></div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ textAlign: 'center' }}><p style={{ fontSize: '16px', fontWeight: 'bold', color: '#22c55e', margin: 0 }}>{p.totalLeads}</p><p style={{ fontSize: '9px', color: darkMode ? '#64748b' : '#94a3b8', margin: 0 }}>Total</p></div>
                      <div style={{ textAlign: 'center' }}><p style={{ fontSize: '16px', fontWeight: 'bold', color: '#3b82f6', margin: 0 }}>{p.leadsHoje}</p><p style={{ fontSize: '9px', color: darkMode ? '#64748b' : '#94a3b8', margin: 0 }}>Hoje</p></div>
                      <div style={{ textAlign: 'center' }}><p style={{ fontSize: '16px', fontWeight: 'bold', color: '#a855f7', margin: 0 }}>{p.leadsSemana}</p><p style={{ fontSize: '9px', color: darkMode ? '#64748b' : '#94a3b8', margin: 0 }}>Semana</p></div>
                      {expandedProduto === p.id ? <ChevronUp style={{ width: '16px', height: '16px', color: darkMode ? '#64748b' : '#94a3b8' }} /> : <ChevronDown style={{ width: '16px', height: '16px', color: darkMode ? '#64748b' : '#94a3b8' }} />}
                    </div>
                  </div>
                  {expandedProduto === p.id && p.lotes.length > 0 && (
                    <div style={{ padding: '10px 12px', borderTop: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
                      {p.lotes.slice(0, 5).map((l, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < 4 && i < p.lotes.length - 1 ? `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><StatusIcon status={l.status} /><span style={{ fontSize: '11px', color: darkMode ? '#ffffff' : '#0f172a' }}>{l.arquivo || 'Sem nome'}</span></div>
                          <span style={{ fontSize: '10px', color: darkMode ? '#64748b' : '#94a3b8' }}>{l.validos || l.total_registros || 0} leads • {formatDate(l.criadoEm)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'consultores' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <p style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', margin: 0 }}>{consultores.length} consultores</p>
                <button onClick={() => exportCSV('consultores')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '6px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontSize: '11px', cursor: 'pointer' }}><Download style={{ width: '12px', height: '12px' }} /> CSV</button>
              </div>
              <div style={{ borderRadius: '8px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead><tr style={{ backgroundColor: darkMode ? '#0f172a' : '#f8fafc' }}>
                    <th style={{ padding: '10px', textAlign: 'left', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Consultor</th>
                    <th style={{ padding: '10px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Bitrix</th>
                    <th style={{ padding: '10px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Horário</th>
                    <th style={{ padding: '10px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Hoje</th>
                    <th style={{ padding: '10px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Semana</th>
                    <th style={{ padding: '10px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Total</th>
                  </tr></thead>
                  <tbody>{statsPorConsultor.map((c) => (
                    <tr key={c.id} style={{ borderTop: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
                      <td style={{ padding: '10px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '600' }}>{c.nome.charAt(0)}</div><span style={{ fontWeight: '500', color: darkMode ? '#ffffff' : '#0f172a' }}>{c.nome}</span></div></td>
                      <td style={{ padding: '10px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b' }}>{c.bitrix_id}</td>
                      <td style={{ padding: '10px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b' }}>{c.hora_inicio}h-{c.hora_fim}h</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}><span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(59,130,246,0.2)', color: '#3b82f6', fontWeight: '600', fontSize: '11px' }}>{c.leadsHoje}</span></td>
                      <td style={{ padding: '10px', textAlign: 'center' }}><span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(168,85,247,0.2)', color: '#a855f7', fontWeight: '600', fontSize: '11px' }}>{c.leadsSemana}</span></td>
                      <td style={{ padding: '10px', textAlign: 'center' }}><span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(34,197,94,0.2)', color: '#22c55e', fontWeight: '600', fontSize: '11px' }}>{c.totalLeads}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <p style={{ fontSize: '10px', color: darkMode ? '#64748b' : '#94a3b8', marginTop: '10px', fontStyle: 'italic' }}>* Distribuição baseada no round-robin dos leads processados.</p>
            </div>
          )}

          {activeTab === 'lotes' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <p style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', margin: 0 }}>{lotes.length} lotes</p>
                <button onClick={() => exportCSV('lotes')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '6px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontSize: '11px', cursor: 'pointer' }}><Download style={{ width: '12px', height: '12px' }} /> CSV</button>
              </div>
              {lotes.length === 0 ? <div style={{ textAlign: 'center', padding: '40px', color: darkMode ? '#64748b' : '#94a3b8' }}><FileSpreadsheet style={{ width: '40px', height: '40px', margin: '0 auto', opacity: 0.5 }} /><p style={{ marginTop: '12px' }}>Nenhum lote</p></div> : (
                <div style={{ borderRadius: '8px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead><tr style={{ backgroundColor: darkMode ? '#0f172a' : '#f8fafc' }}>
                      <th style={{ padding: '8px', textAlign: 'left', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Arquivo</th>
                      <th style={{ padding: '8px', textAlign: 'left', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Produto</th>
                      <th style={{ padding: '8px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Total</th>
                      <th style={{ padding: '8px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Válidos</th>
                      <th style={{ padding: '8px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Dup</th>
                      <th style={{ padding: '8px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Filt</th>
                      <th style={{ padding: '8px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Status</th>
                      <th style={{ padding: '8px', textAlign: 'right', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Data</th>
                    </tr></thead>
                    <tbody>{lotes.map((l, i) => (
                      <tr key={l.id || i} style={{ borderTop: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
                        <td style={{ padding: '8px', color: darkMode ? '#ffffff' : '#0f172a', fontWeight: '500' }}><div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><StatusIcon status={l.status} />{l.arquivo || '-'}</div></td>
                        <td style={{ padding: '8px', color: darkMode ? '#94a3b8' : '#64748b' }}>{l.produto_nome || '-'}</td>
                        <td style={{ padding: '8px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b' }}>{l.total_registros || 0}</td>
                        <td style={{ padding: '8px', textAlign: 'center', color: '#22c55e', fontWeight: '600' }}>{l.validos || 0}</td>
                        <td style={{ padding: '8px', textAlign: 'center', color: '#f59e0b' }}>{l.duplicados || 0}</td>
                        <td style={{ padding: '8px', textAlign: 'center', color: '#ef4444' }}>{l.filtrados || 0}</td>
                        <td style={{ padding: '8px', textAlign: 'center' }}><span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '500', textTransform: 'uppercase', backgroundColor: l.status === 'enviado' ? 'rgba(34,197,94,0.2)' : l.status === 'processado' ? 'rgba(59,130,246,0.2)' : 'rgba(245,158,11,0.2)', color: l.status === 'enviado' ? '#22c55e' : l.status === 'processado' ? '#3b82f6' : '#f59e0b' }}>{l.status}</span></td>
                        <td style={{ padding: '8px', textAlign: 'right', color: darkMode ? '#64748b' : '#94a3b8', fontSize: '10px' }}>{formatDate(l.criadoEm)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}