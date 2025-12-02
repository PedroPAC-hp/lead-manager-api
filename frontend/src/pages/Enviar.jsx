import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { leadsService } from '../services/api';
import { 
  Send, Loader2, Check, X, AlertCircle, 
  RefreshCw, Eye, Users, FileSpreadsheet,
  CheckCircle, XCircle, Clock
} from 'lucide-react';

export default function Enviar() {
  const { darkMode } = useTheme();
  const [loteId, setLoteId] = useState('');
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

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
    backgroundColor: darkMode ? '#0f172a' : '#ffffff',
    color: darkMode ? '#ffffff' : '#0f172a',
    fontSize: '14px',
    outline: 'none',
  };

  const buttonPrimary = {
    display: 'flex',
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

  const buttonSuccess = {
    ...buttonPrimary,
    backgroundColor: '#22c55e',
  };

  const buttonSecondary = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    borderRadius: '8px',
    border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
    backgroundColor: 'transparent',
    color: darkMode ? '#94a3b8' : '#64748b',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  };

  const buscarLote = async () => {
    if (!loteId.trim()) {
      alert('Digite o ID do lote');
      return;
    }
    setLoading(true);
    setResumo(null);
    setLeads([]);
    setResultado(null);
    try {
      const resumoData = await leadsService.getResumo(loteId);
      setResumo(resumoData);
      const leadsData = await leadsService.getLeads(loteId, statusFilter);
      setLeads(leadsData.leads || []);
    } catch (error) {
      console.error('Erro ao buscar lote:', error);
      alert(error.response?.data?.detail || 'Lote não encontrado');
    } finally {
      setLoading(false);
    }
  };

  const carregarLeads = async (status) => {
    setStatusFilter(status);
    try {
      const leadsData = await leadsService.getLeads(loteId, status === 'todos' ? null : status);
      setLeads(leadsData.leads || []);
    } catch (error) {
      console.error('Erro ao carregar leads:', error);
    }
  };

  const enviarParaBitrix = async () => {
    if (!resumo || resumo.processados === 0) {
      alert('Não há leads processados para enviar');
      return;
    }
    if (!confirm(`Deseja enviar ${resumo.processados} leads para o Bitrix24?`)) {
      return;
    }
    setEnviando(true);
    try {
      const result = await leadsService.enviar(loteId);
      setResultado(result);
      // Recarregar resumo
      const resumoData = await leadsService.getResumo(loteId);
      setResumo(resumoData);
      const leadsData = await leadsService.getLeads(loteId, 'enviado');
      setLeads(leadsData.leads || []);
      setStatusFilter('enviado');
    } catch (error) {
      console.error('Erro ao enviar:', error);
      alert(error.response?.data?.detail || 'Erro ao enviar leads');
    } finally {
      setEnviando(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pendente: { bg: darkMode ? 'rgba(148, 163, 184, 0.2)' : '#f1f5f9', color: '#64748b' },
      processado: { bg: darkMode ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff', color: '#3b82f6' },
      enviado: { bg: darkMode ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7', color: '#22c55e' },
      duplicado: { bg: darkMode ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7', color: '#f59e0b' },
      filtrado: { bg: darkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2', color: '#ef4444' },
      erro: { bg: darkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2', color: '#ef4444' },
    };
    const style = styles[status] || styles.pendente;
    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '500',
        backgroundColor: style.bg,
        color: style.color,
        textTransform: 'uppercase',
      }}>
        {status}
      </span>
    );
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div style={{
      padding: '16px',
      borderRadius: '10px',
      backgroundColor: darkMode ? '#0f172a' : '#f8fafc',
      textAlign: 'center',
      border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
    }}>
      <Icon style={{ width: '24px', height: '24px', color, margin: '0 auto 8px' }} />
      <p style={{ fontSize: '24px', fontWeight: 'bold', color, margin: 0 }}>{value}</p>
      <p style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', margin: '4px 0 0 0' }}>{label}</p>
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

      {/* Buscar Lote */}
      <div style={{ ...cardStyle, padding: '20px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', margin: '0 0 16px 0' }}>
          Buscar Lote
        </h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={loteId}
            onChange={(e) => setLoteId(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
            placeholder="Cole o ID do lote aqui (ex: 11e307f5-d772-4263-abb6-282e1ebd1284)"
          />
          <button onClick={buscarLote} style={buttonPrimary} disabled={loading}>
            {loading ? (
              <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
            ) : (
              <RefreshCw style={{ width: '16px', height: '16px' }} />
            )}
            Buscar
          </button>
        </div>
        <p style={{ fontSize: '12px', color: darkMode ? '#64748b' : '#94a3b8', marginTop: '8px' }}>
          O ID do lote é gerado após o upload do arquivo na página de Upload
        </p>
      </div>

      {/* Resultado do Envio */}
      {resultado && (
        <div style={{ ...cardStyle, padding: '20px', marginBottom: '24px', backgroundColor: darkMode ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4', borderColor: '#22c55e' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <CheckCircle style={{ width: '24px', height: '24px', color: '#22c55e' }} />
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#22c55e', margin: 0 }}>
              Envio Concluído!
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#22c55e', margin: 0 }}>{resultado.enviados_sucesso}</p>
              <p style={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b' }}>Enviados com sucesso</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#ef4444', margin: 0 }}>{resultado.enviados_erro}</p>
              <p style={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b' }}>Erros</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: '500', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>
                {resultado.consultores_utilizados?.join(', ') || '-'}
              </p>
              <p style={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b' }}>Consultores</p>
            </div>
          </div>
        </div>
      )}

      {/* Resumo do Lote */}
      {resumo && (
        <div style={{ ...cardStyle, marginBottom: '24px' }}>
          <div style={{ padding: '20px', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>
                  {resumo.produto_nome}
                </h2>
                <p style={{ fontSize: '13px', color: darkMode ? '#64748b' : '#94a3b8', margin: '4px 0 0 0' }}>
                  Lote: {loteId.substring(0, 8)}...
                </p>
              </div>
              {resumo.processados > 0 && !resultado && (
                <button onClick={enviarParaBitrix} style={buttonSuccess} disabled={enviando}>
                  {enviando ? (
                    <><Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />Enviando...</>
                  ) : (
                    <><Send style={{ width: '16px', height: '16px' }} />Enviar para Bitrix</>
                  )}
                </button>
              )}
            </div>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <StatCard icon={FileSpreadsheet} label="Total" value={resumo.total} color="#64748b" />
              <StatCard icon={Clock} label="Pendentes" value={resumo.pendentes} color="#94a3b8" />
              <StatCard icon={Check} label="Processados" value={resumo.processados} color="#3b82f6" />
              <StatCard icon={CheckCircle} label="Enviados" value={resumo.enviados} color="#22c55e" />
              <StatCard icon={AlertCircle} label="Duplicados" value={resumo.duplicados} color="#f59e0b" />
              <StatCard icon={XCircle} label="Filtrados" value={resumo.filtrados} color="#ef4444" />
            </div>

            {/* Filtros */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {['todos', 'processado', 'enviado', 'duplicado', 'filtrado'].map((status) => (
                <button
                  key={status}
                  onClick={() => carregarLeads(status)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: statusFilter === status ? '#3b82f6' : (darkMode ? '#0f172a' : '#f1f5f9'),
                    color: statusFilter === status ? '#ffffff' : (darkMode ? '#94a3b8' : '#64748b'),
                    fontSize: '13px',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Lista de Leads */}
            {leads.length > 0 ? (
              <div style={{ borderRadius: '8px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: darkMode ? '#0f172a' : '#f8fafc' }}>
                      <th style={{ padding: '12px', textAlign: 'left', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Nome</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Celular</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Curso</th>
                      <th style={{ padding: '12px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Info</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.slice(0, 50).map((lead, index) => (
                      <tr key={lead._id || index} style={{ borderTop: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
                        <td style={{ padding: '12px', color: darkMode ? '#ffffff' : '#0f172a' }}>{lead.nome || '-'}</td>
                        <td style={{ padding: '12px', color: darkMode ? '#94a3b8' : '#64748b' }}>{lead.celular || '-'}</td>
                        <td style={{ padding: '12px', color: darkMode ? '#94a3b8' : '#64748b' }}>{lead.curso_nome || lead.curso_codigo || '-'}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{getStatusBadge(lead.status)}</td>
                        <td style={{ padding: '12px', color: darkMode ? '#64748b' : '#94a3b8', fontSize: '12px' }}>
                          {lead.motivo_filtro || lead.bitrix_lead_id || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {leads.length > 50 && (
                  <div style={{ padding: '12px', textAlign: 'center', borderTop: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, color: darkMode ? '#64748b' : '#94a3b8', fontSize: '13px' }}>
                    Mostrando 50 de {leads.length} leads
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px', color: darkMode ? '#64748b' : '#94a3b8' }}>
                <Eye style={{ width: '32px', height: '32px', margin: '0 auto', opacity: 0.5 }} />
                <p style={{ marginTop: '8px' }}>Nenhum lead encontrado com este filtro</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!resumo && !loading && (
        <div style={{ ...cardStyle, padding: '48px', textAlign: 'center' }}>
          <Send style={{ width: '48px', height: '48px', color: darkMode ? '#334155' : '#e2e8f0', margin: '0 auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', marginTop: '16px' }}>
            Nenhum lote selecionado
          </h3>
          <p style={{ fontSize: '14px', color: darkMode ? '#64748b' : '#94a3b8', marginTop: '8px' }}>
            Digite o ID de um lote acima para visualizar e enviar os leads
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
