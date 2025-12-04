import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { estatisticasService } from '../services/api';
import { 
  History, Loader2, RefreshCw, Calendar, Users, Package,
  TrendingUp, Send, FileSpreadsheet, Download,
  ChevronDown, ChevronUp, Clock, CheckCircle, BarChart3, Target, Edit2, Save, X
} from 'lucide-react';

export default function Historico() {
  const { darkMode } = useTheme();
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('geral');
  const [stats, setStats] = useState(null);
  const [consultores, setConsultores] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [disparos, setDisparos] = useState([]);
  const [expandedProduto, setExpandedProduto] = useState(null);
  const [editingLote, setEditingLote] = useState(null);
  const [editNome, setEditNome] = useState('');

  const cardStyle = { backgroundColor: darkMode ? '#1e293b' : '#ffffff', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '12px' };

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashData, consultoresData, produtosData, lotesData, disparosData] = await Promise.all([
        estatisticasService.getDashboard(),
        estatisticasService.getPorConsultor(),
        estatisticasService.getPorProduto(),
        estatisticasService.getLotes(0, 50),
        estatisticasService.getDisparos(0, 50)
      ]);
      setStats(dashData);
      setConsultores(consultoresData.consultores || []);
      setProdutos(produtosData.produtos || []);
      setLotes(lotesData.lotes || []);
      setDisparos(disparosData.disparos || []);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar dados');
    }
    setLoading(false);
  };

  const handleRenomearLote = async (loteId) => {
    if (!editNome.trim()) return;
    try {
      await estatisticasService.renomearLote(loteId, editNome);
      toast.success('Lote renomeado!');
      setEditingLote(null);
      loadData();
    } catch (error) {
      toast.error('Erro ao renomear');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';

  const exportCSV = (type) => {
    let csv = '', filename = '';
    if (type === 'consultores') {
      csv = 'Consultor,Bitrix ID,Hoje,Semana,Mês,Total\n';
      consultores.forEach(c => { csv += `"${c.nome}",${c.bitrix_id},${c.leads_hoje},${c.leads_semana},${c.leads_mes},${c.leads_total}\n`; });
      filename = 'relatorio_consultores.csv';
    } else if (type === 'produtos') {
      csv = 'Produto,Tipo,Lotes,Hoje,Semana,Total\n';
      produtos.forEach(p => { csv += `"${p.nome}","${p.tipo}",${p.total_lotes},${p.leads_hoje},${p.leads_semana},${p.total_enviados}\n`; });
      filename = 'relatorio_produtos.csv';
    } else {
      csv = 'Nome,Arquivo,Produto,Total,Válidos,Status,Data\n';
      lotes.forEach(l => { csv += `"${l.nome || '-'}","${l.arquivo}","${l.produto_nome}",${l.total_registros},${l.validos},"${l.status}","${formatDate(l.created_at)}"\n`; });
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
        <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: `${color}20` }}><Icon style={{ width: '16px', height: '16px', color }} /></div>
      </div>
    </div>
  );

  const TabBtn = ({ id, label, icon: Icon }) => (
    <button onClick={() => setActiveTab(id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '500', backgroundColor: activeTab === id ? '#3b82f6' : 'transparent', color: activeTab === id ? '#fff' : (darkMode ? '#94a3b8' : '#64748b') }}>
      <Icon style={{ width: '14px', height: '14px' }} />{label}
    </button>
  );

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}><Loader2 style={{ width: '32px', height: '32px', color: '#3b82f6', animation: 'spin 1s linear infinite' }} /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: darkMode ? '#fff' : '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}><History style={{ width: '28px', height: '28px', color: '#f59e0b' }} />Histórico e Relatórios</h1>
          <p style={{ color: darkMode ? '#94a3b8' : '#64748b', marginTop: '4px', fontSize: '14px' }}>Dados reais do banco de dados</p>
        </div>
        <button onClick={loadData} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, backgroundColor: 'transparent', color: darkMode ? '#94a3b8' : '#64748b', fontSize: '12px', cursor: 'pointer' }}><RefreshCw style={{ width: '14px', height: '14px' }} />Atualizar</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '20px' }}>
        <StatCard icon={Send} label="Total Enviados" value={stats?.total_leads_enviados || 0} color="#22c55e" />
        <StatCard icon={Calendar} label="Hoje" value={stats?.leads_hoje || 0} color="#3b82f6" />
        <StatCard icon={TrendingUp} label="Semana" value={stats?.leads_semana || 0} color="#a855f7" />
        <StatCard icon={BarChart3} label="Mês" value={stats?.leads_mes || 0} color="#f59e0b" />
        <StatCard icon={Package} label="Lotes" value={stats?.total_lotes || 0} color="#64748b" />
        <StatCard icon={CheckCircle} label="Disparos" value={stats?.lotes_enviados || 0} color="#22c55e" />
      </div>

      <div style={{ ...cardStyle }}>
        <div style={{ padding: '10px 12px', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <TabBtn id="geral" label="Visão Geral" icon={BarChart3} />
          <TabBtn id="consultores" label="Por Consultor" icon={Users} />
          <TabBtn id="produtos" label="Por Produto" icon={Package} />
          <TabBtn id="lotes" label="Lotes" icon={FileSpreadsheet} />
          <TabBtn id="disparos" label="Disparos" icon={Send} />
        </div>

        <div style={{ padding: '16px' }}>
          {/* Visão Geral */}
          {activeTab === 'geral' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '600', color: darkMode ? '#fff' : '#0f172a', margin: 0 }}>👥 Top Consultores</h3>
                  <button onClick={() => exportCSV('consultores')} style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', backgroundColor: darkMode ? '#334155' : '#e2e8f0', color: darkMode ? '#94a3b8' : '#64748b', fontSize: '10px', cursor: 'pointer' }}>CSV</button>
                </div>
                {consultores.slice(0, 5).map((c, i) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', marginBottom: '6px', borderRadius: '8px', backgroundColor: darkMode ? '#0f172a' : '#f8fafc' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: '600' }}>{i + 1}</div>
                    <div style={{ flex: 1 }}><p style={{ fontSize: '12px', fontWeight: '500', color: darkMode ? '#fff' : '#0f172a', margin: 0 }}>{c.nome}</p><p style={{ fontSize: '10px', color: darkMode ? '#64748b' : '#94a3b8', margin: 0 }}>{c.hora_inicio}h-{c.hora_fim}h</p></div>
                    <div style={{ textAlign: 'right' }}><p style={{ fontSize: '14px', fontWeight: '600', color: '#3b82f6', margin: 0 }}>{c.leads_total}</p><p style={{ fontSize: '9px', color: darkMode ? '#64748b' : '#94a3b8', margin: 0 }}>total</p></div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '600', color: darkMode ? '#fff' : '#0f172a', margin: 0 }}>📦 Top Produtos</h3>
                  <button onClick={() => exportCSV('produtos')} style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', backgroundColor: darkMode ? '#334155' : '#e2e8f0', color: darkMode ? '#94a3b8' : '#64748b', fontSize: '10px', cursor: 'pointer' }}>CSV</button>
                </div>
                {produtos.slice(0, 5).map((p, i) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', marginBottom: '6px', borderRadius: '8px', backgroundColor: darkMode ? '#0f172a' : '#f8fafc' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: p.tipo === 'pos' ? '#3b82f6' : p.tipo === 'tec' ? '#22c55e' : '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: '600' }}>{i + 1}</div>
                    <div style={{ flex: 1 }}><p style={{ fontSize: '12px', fontWeight: '500', color: darkMode ? '#fff' : '#0f172a', margin: 0 }}>{p.nome}</p><p style={{ fontSize: '10px', color: darkMode ? '#64748b' : '#94a3b8', margin: 0 }}>{p.total_lotes} lotes</p></div>
                    <div style={{ textAlign: 'right' }}><p style={{ fontSize: '14px', fontWeight: '600', color: '#22c55e', margin: 0 }}>{p.total_enviados}</p><p style={{ fontSize: '9px', color: darkMode ? '#64748b' : '#94a3b8', margin: 0 }}>enviados</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Por Consultor */}
          {activeTab === 'consultores' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <p style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', margin: 0 }}>{consultores.length} consultores • Dados reais do Bitrix</p>
                <button onClick={() => exportCSV('consultores')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '6px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontSize: '11px', cursor: 'pointer' }}><Download style={{ width: '12px', height: '12px' }} /> CSV</button>
              </div>
              <div style={{ borderRadius: '8px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead><tr style={{ backgroundColor: darkMode ? '#0f172a' : '#f8fafc' }}>
                    <th style={{ padding: '10px', textAlign: 'left', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Consultor</th>
                    <th style={{ padding: '10px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Bitrix</th>
                    <th style={{ padding: '10px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Hoje</th>
                    <th style={{ padding: '10px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Semana</th>
                    <th style={{ padding: '10px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Mês</th>
                    <th style={{ padding: '10px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Total</th>
                  </tr></thead>
                  <tbody>{consultores.map((c) => (
                    <tr key={c.id} style={{ borderTop: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
                      <td style={{ padding: '10px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '600' }}>{c.nome.charAt(0)}</div><span style={{ fontWeight: '500', color: darkMode ? '#fff' : '#0f172a' }}>{c.nome}</span></div></td>
                      <td style={{ padding: '10px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b' }}>{c.bitrix_id}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}><span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(59,130,246,0.2)', color: '#3b82f6', fontWeight: '600', fontSize: '11px' }}>{c.leads_hoje}</span></td>
                      <td style={{ padding: '10px', textAlign: 'center' }}><span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(168,85,247,0.2)', color: '#a855f7', fontWeight: '600', fontSize: '11px' }}>{c.leads_semana}</span></td>
                      <td style={{ padding: '10px', textAlign: 'center' }}><span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(245,158,11,0.2)', color: '#f59e0b', fontWeight: '600', fontSize: '11px' }}>{c.leads_mes}</span></td>
                      <td style={{ padding: '10px', textAlign: 'center' }}><span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(34,197,94,0.2)', color: '#22c55e', fontWeight: '600', fontSize: '11px' }}>{c.leads_total}</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}

          {/* Por Produto */}
          {activeTab === 'produtos' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <p style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', margin: 0 }}>{produtos.length} produtos</p>
                <button onClick={() => exportCSV('produtos')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '6px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontSize: '11px', cursor: 'pointer' }}><Download style={{ width: '12px', height: '12px' }} /> CSV</button>
              </div>
              {produtos.map((p) => (
                <div key={p.id} style={{ borderRadius: '8px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, marginBottom: '8px', overflow: 'hidden' }}>
                  <div onClick={() => setExpandedProduto(expandedProduto === p.id ? null : p.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', cursor: 'pointer', backgroundColor: darkMode ? '#0f172a' : '#f8fafc' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: p.tipo === 'pos' ? '#3b82f6' : p.tipo === 'tec' ? '#22c55e' : '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package style={{ width: '16px', height: '16px', color: '#fff' }} /></div>
                    <div style={{ flex: 1 }}><p style={{ fontSize: '13px', fontWeight: '600', color: darkMode ? '#fff' : '#0f172a', margin: 0 }}>{p.nome}</p><p style={{ fontSize: '10px', color: darkMode ? '#64748b' : '#94a3b8', margin: 0 }}>{p.total_lotes} lotes</p></div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ textAlign: 'center' }}><p style={{ fontSize: '16px', fontWeight: 'bold', color: '#22c55e', margin: 0 }}>{p.total_enviados}</p><p style={{ fontSize: '9px', color: darkMode ? '#64748b' : '#94a3b8', margin: 0 }}>Total</p></div>
                      <div style={{ textAlign: 'center' }}><p style={{ fontSize: '16px', fontWeight: 'bold', color: '#3b82f6', margin: 0 }}>{p.leads_hoje}</p><p style={{ fontSize: '9px', color: darkMode ? '#64748b' : '#94a3b8', margin: 0 }}>Hoje</p></div>
                      <div style={{ textAlign: 'center' }}><p style={{ fontSize: '16px', fontWeight: 'bold', color: '#a855f7', margin: 0 }}>{p.leads_semana}</p><p style={{ fontSize: '9px', color: darkMode ? '#64748b' : '#94a3b8', margin: 0 }}>Semana</p></div>
                      {expandedProduto === p.id ? <ChevronUp style={{ width: '16px', height: '16px', color: darkMode ? '#64748b' : '#94a3b8' }} /> : <ChevronDown style={{ width: '16px', height: '16px', color: darkMode ? '#64748b' : '#94a3b8' }} />}
                    </div>
                  </div>
                  {expandedProduto === p.id && (
                    <div style={{ padding: '12px', borderTop: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
                      <p style={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#64748b', margin: '0 0 8px 0' }}>Último lote: {p.ultimo_lote || 'Nenhum'}</p>
                      {p.ultimo_lote_data && <p style={{ fontSize: '10px', color: darkMode ? '#64748b' : '#94a3b8', margin: 0 }}>Data: {formatDate(p.ultimo_lote_data)}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Lotes */}
          {activeTab === 'lotes' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <p style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', margin: 0 }}>{lotes.length} lotes no banco</p>
                <button onClick={() => exportCSV('lotes')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', borderRadius: '6px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontSize: '11px', cursor: 'pointer' }}><Download style={{ width: '12px', height: '12px' }} /> CSV</button>
              </div>
              <div style={{ borderRadius: '8px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead><tr style={{ backgroundColor: darkMode ? '#0f172a' : '#f8fafc' }}>
                    <th style={{ padding: '8px', textAlign: 'left', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Nome</th>
                    <th style={{ padding: '8px', textAlign: 'left', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Produto</th>
                    <th style={{ padding: '8px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Válidos</th>
                    <th style={{ padding: '8px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '8px', textAlign: 'right', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Data</th>
                    <th style={{ padding: '8px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Ações</th>
                  </tr></thead>
                  <tbody>{lotes.map((l) => (
                    <tr key={l.id} style={{ borderTop: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
                      <td style={{ padding: '8px' }}>
                        {editingLote === l.id ? (
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <input type="text" value={editNome} onChange={e => setEditNome(e.target.value)} style={{ padding: '4px 8px', borderRadius: '4px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, backgroundColor: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#fff' : '#0f172a', fontSize: '11px', width: '120px' }} />
                            <button onClick={() => handleRenomearLote(l.id)} style={{ padding: '4px', border: 'none', backgroundColor: '#22c55e', borderRadius: '4px', cursor: 'pointer' }}><Save style={{ width: '12px', height: '12px', color: '#fff' }} /></button>
                            <button onClick={() => setEditingLote(null)} style={{ padding: '4px', border: 'none', backgroundColor: '#ef4444', borderRadius: '4px', cursor: 'pointer' }}><X style={{ width: '12px', height: '12px', color: '#fff' }} /></button>
                          </div>
                        ) : (
                          <span style={{ color: darkMode ? '#fff' : '#0f172a', fontWeight: '500' }}>{l.nome || l.arquivo || '-'}</span>
                        )}
                      </td>
                      <td style={{ padding: '8px', color: darkMode ? '#94a3b8' : '#64748b' }}>{l.produto_nome}</td>
                      <td style={{ padding: '8px', textAlign: 'center', color: '#22c55e', fontWeight: '600' }}>{l.validos}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '500', textTransform: 'uppercase', backgroundColor: l.status === 'enviado' ? 'rgba(34,197,94,0.2)' : l.status === 'processado' ? 'rgba(59,130,246,0.2)' : 'rgba(245,158,11,0.2)', color: l.status === 'enviado' ? '#22c55e' : l.status === 'processado' ? '#3b82f6' : '#f59e0b' }}>{l.status}</span>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', color: darkMode ? '#64748b' : '#94a3b8', fontSize: '10px' }}>{formatDate(l.created_at)}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <button onClick={() => { setEditingLote(l.id); setEditNome(l.nome || l.arquivo || ''); }} style={{ padding: '4px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}><Edit2 style={{ width: '12px', height: '12px', color: darkMode ? '#94a3b8' : '#64748b' }} /></button>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}

          {/* Disparos */}
          {activeTab === 'disparos' && (
            <div>
              <p style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', margin: '0 0 12px 0' }}>{disparos.length} disparos realizados</p>
              <div style={{ borderRadius: '8px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead><tr style={{ backgroundColor: darkMode ? '#0f172a' : '#f8fafc' }}>
                    <th style={{ padding: '8px', textAlign: 'left', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Lote</th>
                    <th style={{ padding: '8px', textAlign: 'left', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Produto</th>
                    <th style={{ padding: '8px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Sucesso</th>
                    <th style={{ padding: '8px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Erro</th>
                    <th style={{ padding: '8px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '8px', textAlign: 'right', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Data</th>
                  </tr></thead>
                  <tbody>{disparos.map((d) => (
                    <tr key={d.id} style={{ borderTop: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
                      <td style={{ padding: '8px', color: darkMode ? '#fff' : '#0f172a', fontWeight: '500' }}>{d.lote_nome || d.lote_id?.substring(0, 8)}</td>
                      <td style={{ padding: '8px', color: darkMode ? '#94a3b8' : '#64748b' }}>{d.produto_nome}</td>
                      <td style={{ padding: '8px', textAlign: 'center', color: '#22c55e', fontWeight: '600' }}>{d.enviados_sucesso}</td>
                      <td style={{ padding: '8px', textAlign: 'center', color: '#ef4444', fontWeight: '600' }}>{d.enviados_erro}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}><span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '500', backgroundColor: d.status === 'concluido' ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.2)', color: d.status === 'concluido' ? '#22c55e' : '#3b82f6' }}>{d.status}</span></td>
                      <td style={{ padding: '8px', textAlign: 'right', color: darkMode ? '#64748b' : '#94a3b8', fontSize: '10px' }}>{formatDate(d.iniciado_em)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}