import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { leadsService } from '../services/api';
import { 
  History, Loader2, RefreshCw, Search, 
  Calendar, User, FileSpreadsheet, CheckCircle
} from 'lucide-react';

export default function Historico() {
  const { darkMode } = useTheme();
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 50;

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

  const buttonSecondary = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '8px',
    border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
    backgroundColor: 'transparent',
    color: darkMode ? '#94a3b8' : '#64748b',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  };

  useEffect(() => {
    loadHistorico();
  }, [page]);

  const loadHistorico = async () => {
    setLoading(true);
    try {
      const data = await leadsService.getHistorico(page * limit, limit);
      setHistorico(data.historico || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredHistorico = historico.filter(item =>
    item.candidato_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <History style={{ width: '28px', height: '28px', color: '#f59e0b' }} />
          Histórico
        </h1>
        <p style={{ color: darkMode ? '#94a3b8' : '#64748b', marginTop: '4px', fontSize: '14px' }}>
          Visualize o histórico de leads enviados para o Bitrix24
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ ...cardStyle, padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileSpreadsheet style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
          </div>
          <div>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>{total}</p>
            <p style={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b', margin: 0 }}>Total de Leads Enviados</p>
          </div>
        </div>
        <div style={{ ...cardStyle, padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: darkMode ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle style={{ width: '24px', height: '24px', color: '#22c55e' }} />
          </div>
          <div>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>{historico.length}</p>
            <p style={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b', margin: 0 }}>Nesta Página</p>
          </div>
        </div>
        <div style={{ ...cardStyle, padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: darkMode ? 'rgba(168, 85, 247, 0.2)' : '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar style={{ width: '24px', height: '24px', color: '#a855f7' }} />
          </div>
          <div>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>{Math.ceil(total / limit)}</p>
            <p style={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b', margin: 0 }}>Páginas</p>
          </div>
        </div>
      </div>

      {/* Search & Refresh */}
      <div style={{ ...cardStyle, padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: darkMode ? '#64748b' : '#94a3b8' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '40px' }}
              placeholder="Buscar por ID do candidato..."
            />
          </div>
          <button onClick={loadHistorico} style={buttonSecondary}>
            <RefreshCw style={{ width: '16px', height: '16px' }} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={cardStyle}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b' }}>
            <Loader2 style={{ width: '32px', height: '32px', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '12px' }}>Carregando histórico...</p>
          </div>
        ) : filteredHistorico.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b' }}>
            <History style={{ width: '48px', height: '48px', margin: '0 auto', opacity: 0.5 }} />
            <p style={{ marginTop: '12px' }}>Nenhum registro encontrado</p>
          </div>
        ) : (
          <>
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: darkMode ? '#0f172a' : '#f8fafc' }}>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>ID Candidato</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Produto</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Lote</th>
                    <th style={{ padding: '14px 16px', textAlign: 'left', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Enviado em</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistorico.map((item, index) => (
                    <tr key={item._id || index} style={{ borderTop: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: darkMode ? '#0f172a' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User style={{ width: '16px', height: '16px', color: darkMode ? '#64748b' : '#94a3b8' }} />
                          </div>
                          <span style={{ fontWeight: '500', color: darkMode ? '#ffffff' : '#0f172a' }}>
                            {item.candidato_id || '-'}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                        {item.produto_id?.substring(0, 8) || '-'}...
                      </td>
                      <td style={{ padding: '14px 16px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                        {item.lote_id?.substring(0, 8) || '-'}...
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: darkMode ? '#0f172a' : '#f1f5f9',
                          color: darkMode ? '#94a3b8' : '#64748b',
                          fontSize: '12px',
                        }}>
                          <Calendar style={{ width: '12px', height: '12px' }} />
                          {formatDate(item.enviado_em)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > limit && (
              <div style={{ padding: '16px', borderTop: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                  Página {page + 1} de {Math.ceil(total / limit)}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    style={{
                      ...buttonSecondary,
                      opacity: page === 0 ? 0.5 : 1,
                      cursor: page === 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={(page + 1) * limit >= total}
                    style={{
                      ...buttonSecondary,
                      opacity: (page + 1) * limit >= total ? 0.5 : 1,
                      cursor: (page + 1) * limit >= total ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
