import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { leadsService } from '../services/api';
import { 
  Send, Loader2, Check, RefreshCw, Eye, 
  CheckCircle, XCircle, Clock, FileSpreadsheet, AlertTriangle
} from 'lucide-react';

export default function Enviar() {
  const { darkMode } = useTheme();
  const toast = useToast();
  const [lotes, setLotes] = useState([]);
  const [selectedLote, setSelectedLote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resumo, setResumo] = useState(null);
  const [leads, setLeads] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [statusFilter, setStatusFilter] = useState('processado');

  const cardStyle = {
    backgroundColor: darkMode ? '#1e293b' : '#ffffff',
    border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
    borderRadius: '12px',
  };

  const buttonPrimary = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  };

  const buttonSuccess = { ...buttonPrimary, backgroundColor: '#22c55e' };

  useEffect(() => {
    loadLotes();
  }, []);

  const loadLotes = () => {
    try {
      const saved = localStorage.getItem('leadmanager_lotes');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Filtrar apenas lotes processados ou enviados
        setLotes(parsed.filter(l => l.status === 'processado' || l.status === 'enviado'));
      }
    } catch (e) {}
  };

  const updateLoteStatus = (loteId, status) => {
    try {
      const saved = localStorage.getItem('leadmanager_lotes');
      if (saved) {
        const parsed = JSON.parse(saved);
        const updated = parsed.map(l => l.id === loteId ? { ...l, status } : l);
        localStorage.setItem('leadmanager_lotes', JSON.stringify(updated));
        setLotes(updated.filter(l => l.status === 'processado' || l.status === 'enviado'));
      }
    } catch (e) {}
  };

  const handleSelectLote = async (lote) => {
    setSelectedLote(lote);
    setResultado(null);
    setLoading(true);
    try {
      const resumoData = await leadsService.getResumo(lote.id);
      setResumo(resumoData);
      const leadsData = await leadsService.getLeads(lote.id, statusFilter);
      setLeads(leadsData.leads || []);
    } catch (error) {
      toast.error('Erro ao carregar lote');
      setResumo(null);
    } finally {
      setLoading(false);
    }
  };

  const carregarLeads = async (status) => {
    if (!selectedLote) return;
    setStatusFilter(status);
    try {
      const leadsData = await leadsService.getLeads(selectedLote.id, status === 'todos' ? null : status);
      setLeads(leadsData.leads || []);
    } catch (error) {
      console.error('Erro ao carregar leads:', error);
    }
  };

  const enviarParaBitrix = async () => {
    if (!resumo || resumo.processados === 0) {
      toast.warning('Não há leads processados para enviar');
      return;
    }
    setEnviando(true);
    try {
      const result = await leadsService.enviar(selectedLote.id);
      setResultado(result);
      updateLoteStatus(selectedLote.id, 'enviado');
      toast.success(`${result.enviados_sucesso} leads enviados com sucesso!`);
      // Recarregar resumo
      const resumoData = await leadsService.getResumo(selectedLote.id);
      setResumo(resumoData);
      const leadsData = await leadsService.getLeads(selectedLote.id, 'enviado');
      setLeads(leadsData.leads || []);
      setStatusFilter('enviado');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao enviar leads');
    } finally {
      setEnviando(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pendente: { bg: 'rgba(148,163,184,0.2)', color: '#64748b' },
      processado: { bg: 'rgba(59,130,246,0.2)', color: '#3b82f6' },
      enviado: { bg: 'rgba(34,197,94,0.2)', color: '#22c55e' },
      duplicado: { bg: 'rgba(245,158,11,0.2)', color: '#f59e0b' },
      filtrado: { bg: 'rgba(239,68,68,0.2)', color: '#ef4444' },
      erro: { bg: 'rgba(239,68,68,0.2)', color: '#ef4444' },
    };
    const s = styles[status] || styles.pendente;
    return <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '500', backgroundColor: s.bg, color: s.color, textTransform: 'uppercase' }}>{status}</span>;
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: darkMode ? '#0f172a' : '#f8fafc', textAlign: 'center' }}>
      <Icon style={{ width: '20px', height: '20px', color, margin: '0 auto 8px' }} />
      <p style={{ fontSize: '24px', fontWeight: 'bold', color, margin: 0 }}>{value}</p>
      <p style={{ fontSize: '11px', color: darkMode ? '#64748b' : '#94a3b8', margin: '4px 0 0 0' }}>{label}</p>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Send style={{ width: '28px', height: '28px', color: '#22c55e' }} />
          Enviar Leads
        </h1>
        <p style={{ color: darkMode ? '#94a3b8' : '#64748b', marginTop: '4px', fontSize: '14px' }}>
          Revise e envie leads processados para o Bitrix24
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
        {/* Lista de Lotes */}
        <div style={cardStyle}>
          <div style={{ padding: '16px', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>Lotes Disponíveis</h2>
            <button onClick={loadLotes} style={{ padding: '4px', border: 'none', background: 'transparent', color: darkMode ? '#64748b' : '#94a3b8', cursor: 'pointer' }}>
              <RefreshCw style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
          <div style={{ padding: '8px', maxHeight: '500px', overflow: 'auto' }}>
            {lotes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: darkMode ? '#64748b' : '#94a3b8' }}>
                <FileSpreadsheet style={{ width: '32px', height: '32px', margin: '0 auto', opacity: 0.5 }} />
                <p style={{ marginTop: '8px', fontSize: '12px' }}>Nenhum lote processado</p>
                <p style={{ fontSize: '11px' }}>Faça upload de uma base primeiro</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {lotes.map((lote) => (
                  <div key={lote.id} onClick={() => handleSelectLote(lote)} style={{
                    padding: '12px', borderRadius: '8px', cursor: 'pointer',
                    backgroundColor: selectedLote?.id === lote.id ? (darkMode ? 'rgba(59,130,246,0.2)' : '#eff6ff') : (darkMode ? '#0f172a' : '#f8fafc'),
                    border: `1px solid ${selectedLote?.id === lote.id ? '#3b82f6' : 'transparent'}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      {lote.status === 'enviado' ? <CheckCircle style={{ width: '14px', height: '14px', color: '#22c55e' }} /> : <Clock style={{ width: '14px', height: '14px', color: '#3b82f6' }} />}
                      <span style={{ fontSize: '12px', fontWeight: '500', color: darkMode ? '#ffffff' : '#0f172a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lote.arquivo || 'Sem nome'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: darkMode ? '#64748b' : '#94a3b8' }}>{lote.validos || 0} válidos</span>
                      <span style={{
                        padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '500', textTransform: 'uppercase',
                        backgroundColor: lote.status === 'enviado' ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.2)',
                        color: lote.status === 'enviado' ? '#22c55e' : '#3b82f6',
                      }}>{lote.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detalhes do Lote */}
        <div>
          {!selectedLote ? (
            <div style={{ ...cardStyle, padding: '48px', textAlign: 'center' }}>
              <Send style={{ width: '48px', height: '48px', color: darkMode ? '#334155' : '#e2e8f0', margin: '0 auto' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', marginTop: '16px' }}>Selecione um Lote</h3>
              <p style={{ fontSize: '13px', color: darkMode ? '#64748b' : '#94a3b8', marginTop: '8px' }}>Escolha um lote na lista ao lado para visualizar</p>
            </div>
          ) : loading ? (
            <div style={{ ...cardStyle, padding: '48px', textAlign: 'center' }}>
              <Loader2 style={{ width: '32px', height: '32px', color: '#3b82f6', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '12px', color: darkMode ? '#94a3b8' : '#64748b' }}>Carregando...</p>
            </div>
          ) : (
            <>
              {/* Resultado do Envio */}
              {resultado && (
                <div style={{ ...cardStyle, padding: '16px', marginBottom: '16px', backgroundColor: darkMode ? 'rgba(34,197,94,0.1)' : '#f0fdf4', borderColor: '#22c55e' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CheckCircle style={{ width: '24px', height: '24px', color: '#22c55e' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: '600', color: '#22c55e', margin: 0 }}>Envio Concluído!</p>
                      <p style={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b', margin: '4px 0 0 0' }}>
                        {resultado.enviados_sucesso} enviados com sucesso, {resultado.enviados_erro} erros
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Resumo */}
              {resumo && (
                <div style={cardStyle}>
                  <div style={{ padding: '16px', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h2 style={{ fontSize: '15px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>{selectedLote.produto_nome}</h2>
                      <p style={{ fontSize: '12px', color: darkMode ? '#64748b' : '#94a3b8', margin: '2px 0 0 0' }}>{selectedLote.arquivo}</p>
                    </div>
                    {resumo.processados > 0 && selectedLote.status !== 'enviado' && (
                      <button onClick={enviarParaBitrix} style={buttonSuccess} disabled={enviando}>
                        {enviando ? <><Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> Enviando...</> : <><Send style={{ width: '16px', height: '16px' }} /> Enviar para Bitrix</>}
                      </button>
                    )}
                    {selectedLote.status === 'enviado' && (
                      <span style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: 'rgba(34,197,94,0.2)', color: '#22c55e', fontSize: '13px', fontWeight: '500' }}>
                        <Check style={{ width: '14px', height: '14px', display: 'inline', marginRight: '4px' }} /> Já Enviado
                      </span>
                    )}
                  </div>

                  <div style={{ padding: '16px' }}>
                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '16px' }}>
                      <StatCard icon={FileSpreadsheet} label="Total" value={resumo.total} color="#64748b" />
                      <StatCard icon={Check} label="Processados" value={resumo.processados} color="#3b82f6" />
                      <StatCard icon={CheckCircle} label="Enviados" value={resumo.enviados} color="#22c55e" />
                      <StatCard icon={AlertTriangle} label="Duplicados" value={resumo.duplicados} color="#f59e0b" />
                      <StatCard icon={XCircle} label="Filtrados" value={resumo.filtrados} color="#ef4444" />
                    </div>

                    {/* Filtros */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      {['todos', 'processado', 'enviado', 'duplicado', 'filtrado'].map((s) => (
                        <button key={s} onClick={() => carregarLeads(s)} style={{
                          padding: '5px 10px', borderRadius: '6px', border: 'none', fontSize: '12px', cursor: 'pointer', textTransform: 'capitalize',
                          backgroundColor: statusFilter === s ? '#3b82f6' : (darkMode ? '#0f172a' : '#f1f5f9'),
                          color: statusFilter === s ? '#fff' : (darkMode ? '#94a3b8' : '#64748b'),
                        }}>{s}</button>
                      ))}
                    </div>

                    {/* Lista de Leads */}
                    {leads.length > 0 ? (
                      <div style={{ borderRadius: '8px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, overflow: 'hidden', maxHeight: '300px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                          <thead>
                            <tr style={{ backgroundColor: darkMode ? '#0f172a' : '#f8fafc' }}>
                              <th style={{ padding: '10px 12px', textAlign: 'left', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Nome</th>
                              <th style={{ padding: '10px 12px', textAlign: 'left', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Celular</th>
                              <th style={{ padding: '10px 12px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {leads.slice(0, 50).map((lead, i) => (
                              <tr key={lead._id || i} style={{ borderTop: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
                                <td style={{ padding: '10px 12px', color: darkMode ? '#ffffff' : '#0f172a' }}>{lead.nome || '-'}</td>
                                <td style={{ padding: '10px 12px', color: darkMode ? '#94a3b8' : '#64748b' }}>{lead.celular || '-'}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>{getStatusBadge(lead.status)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {leads.length > 50 && (
                          <div style={{ padding: '10px', textAlign: 'center', borderTop: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, color: darkMode ? '#64748b' : '#94a3b8', fontSize: '11px' }}>
                            Mostrando 50 de {leads.length}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '24px', color: darkMode ? '#64748b' : '#94a3b8' }}>
                        <Eye style={{ width: '24px', height: '24px', margin: '0 auto', opacity: 0.5 }} />
                        <p style={{ marginTop: '8px', fontSize: '12px' }}>Nenhum lead com este filtro</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
