import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { consultoresService } from '../services/api';
import { 
  Users, Plus, Edit2, Trash2, Loader2, Search, 
  X, Check, Clock, User 
} from 'lucide-react';

export default function Consultores() {
  const { darkMode } = useTheme();
  const [consultores, setConsultores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingConsultor, setEditingConsultor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    bitrix_id: '',
    hora_inicio: 8,
    hora_fim: 18,
    ativo: true,
  });

  // Estilos
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
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  };

  const buttonSecondary = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '8px',
    border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
    backgroundColor: 'transparent',
    color: darkMode ? '#94a3b8' : '#64748b',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  };

  useEffect(() => {
    loadConsultores();
  }, []);

  const loadConsultores = async () => {
    try {
      const data = await consultoresService.list();
      setConsultores(data);
    } catch (error) {
      console.error('Erro ao carregar consultores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (consultor = null) => {
    if (consultor) {
      setEditingConsultor(consultor);
      setFormData({
        nome: consultor.nome,
        bitrix_id: consultor.bitrix_id,
        hora_inicio: consultor.hora_inicio,
        hora_fim: consultor.hora_fim,
        ativo: consultor.ativo,
      });
    } else {
      setEditingConsultor(null);
      setFormData({
        nome: '',
        bitrix_id: '',
        hora_inicio: 8,
        hora_fim: 18,
        ativo: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingConsultor(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        bitrix_id: parseInt(formData.bitrix_id),
        hora_inicio: parseInt(formData.hora_inicio),
        hora_fim: parseInt(formData.hora_fim),
      };

      if (editingConsultor) {
        await consultoresService.update(editingConsultor.id, payload);
      } else {
        await consultoresService.create(payload);
      }

      await loadConsultores();
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar consultor:', error);
      alert(error.response?.data?.detail || 'Erro ao salvar consultor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, nome) => {
    if (!confirm(`Tem certeza que deseja excluir "${nome}"?`)) return;

    try {
      await consultoresService.delete(id);
      await loadConsultores();
    } catch (error) {
      console.error('Erro ao excluir consultor:', error);
      alert('Erro ao excluir consultor');
    }
  };

  const filteredConsultores = consultores.filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px' 
      }}>
        <div>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: darkMode ? '#ffffff' : '#0f172a',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Users style={{ width: '28px', height: '28px', color: '#3b82f6' }} />
            Consultores
          </h1>
          <p style={{ 
            color: darkMode ? '#94a3b8' : '#64748b', 
            marginTop: '4px',
            fontSize: '14px' 
          }}>
            Gerencie os consultores que receberão os leads
          </p>
        </div>
        <button style={buttonPrimary} onClick={() => handleOpenModal()}>
          <Plus style={{ width: '18px', height: '18px' }} />
          Novo Consultor
        </button>
      </div>

      {/* Search */}
      <div style={{ ...cardStyle, padding: '16px', marginBottom: '24px' }}>
        <div style={{ position: 'relative' }}>
          <Search style={{ 
            position: 'absolute', 
            left: '12px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            width: '18px',
            height: '18px',
            color: darkMode ? '#64748b' : '#94a3b8'
          }} />
          <input
            type="text"
            placeholder="Buscar consultor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ ...inputStyle, paddingLeft: '40px' }}
          />
        </div>
      </div>

      {/* Lista */}
      <div style={cardStyle}>
        {loading ? (
          <div style={{ 
            padding: '48px', 
            textAlign: 'center',
            color: darkMode ? '#94a3b8' : '#64748b'
          }}>
            <Loader2 style={{ 
              width: '32px', 
              height: '32px', 
              margin: '0 auto',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ marginTop: '12px' }}>Carregando consultores...</p>
          </div>
        ) : filteredConsultores.length === 0 ? (
          <div style={{ 
            padding: '48px', 
            textAlign: 'center',
            color: darkMode ? '#94a3b8' : '#64748b'
          }}>
            <User style={{ width: '48px', height: '48px', margin: '0 auto', opacity: 0.5 }} />
            <p style={{ marginTop: '12px' }}>
              {searchTerm ? 'Nenhum consultor encontrado' : 'Nenhum consultor cadastrado'}
            </p>
          </div>
        ) : (
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ 
                  borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                }}>
                  <th style={{ 
                    padding: '14px 16px', 
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: darkMode ? '#94a3b8' : '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Nome</th>
                  <th style={{ 
                    padding: '14px 16px', 
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: darkMode ? '#94a3b8' : '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Bitrix ID</th>
                  <th style={{ 
                    padding: '14px 16px', 
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: darkMode ? '#94a3b8' : '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Horário</th>
                  <th style={{ 
                    padding: '14px 16px', 
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: darkMode ? '#94a3b8' : '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Status</th>
                  <th style={{ 
                    padding: '14px 16px', 
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: darkMode ? '#94a3b8' : '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredConsultores.map((consultor) => (
                  <tr 
                    key={consultor.id}
                    style={{ 
                      borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                    }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: '#3b82f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontWeight: '600',
                          fontSize: '14px',
                        }}>
                          {consultor.nome.charAt(0)}
                        </div>
                        <span style={{ 
                          fontWeight: '500',
                          color: darkMode ? '#ffffff' : '#0f172a'
                        }}>
                          {consultor.nome}
                        </span>
                      </div>
                    </td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'center',
                      color: darkMode ? '#94a3b8' : '#64748b'
                    }}>
                      {consultor.bitrix_id}
                    </td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'center',
                    }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: darkMode ? '#0f172a' : '#f1f5f9',
                        color: darkMode ? '#94a3b8' : '#64748b',
                        fontSize: '13px',
                      }}>
                        <Clock style={{ width: '14px', height: '14px' }} />
                        {consultor.hora_inicio}h - {consultor.hora_fim}h
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: consultor.ativo 
                          ? (darkMode ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7')
                          : (darkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2'),
                        color: consultor.ativo ? '#22c55e' : '#ef4444',
                      }}>
                        {consultor.ativo ? (
                          <>
                            <Check style={{ width: '12px', height: '12px' }} />
                            Ativo
                          </>
                        ) : (
                          <>
                            <X style={{ width: '12px', height: '12px' }} />
                            Inativo
                          </>
                        )}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleOpenModal(consultor)}
                          style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: darkMode ? '#0f172a' : '#f1f5f9',
                            color: '#3b82f6',
                            cursor: 'pointer',
                          }}
                          title="Editar"
                        >
                          <Edit2 style={{ width: '16px', height: '16px' }} />
                        </button>
                        <button
                          onClick={() => handleDelete(consultor.id, consultor.nome)}
                          style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: darkMode ? '#0f172a' : '#f1f5f9',
                            color: '#ef4444',
                            cursor: 'pointer',
                          }}
                          title="Excluir"
                        >
                          <Trash2 style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}>
          <div style={{
            ...cardStyle,
            width: '100%',
            maxWidth: '480px',
            margin: '16px',
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: darkMode ? '#ffffff' : '#0f172a',
                margin: 0,
              }}>
                {editingConsultor ? 'Editar Consultor' : 'Novo Consultor'}
              </h2>
              <button
                onClick={handleCloseModal}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: darkMode ? '#94a3b8' : '#64748b',
                  cursor: 'pointer',
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit}>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Nome */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: darkMode ? '#94a3b8' : '#64748b',
                    marginBottom: '6px',
                  }}>
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    style={inputStyle}
                    placeholder="Nome do consultor"
                    required
                  />
                </div>

                {/* Bitrix ID */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: darkMode ? '#94a3b8' : '#64748b',
                    marginBottom: '6px',
                  }}>
                    Bitrix ID *
                  </label>
                  <input
                    type="number"
                    value={formData.bitrix_id}
                    onChange={(e) => setFormData({ ...formData, bitrix_id: e.target.value })}
                    style={inputStyle}
                    placeholder="ID do usuário no Bitrix"
                    required
                  />
                </div>

                {/* Horários */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: darkMode ? '#94a3b8' : '#64748b',
                      marginBottom: '6px',
                    }}>
                      Hora Início
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={formData.hora_inicio}
                      onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: darkMode ? '#94a3b8' : '#64748b',
                      marginBottom: '6px',
                    }}>
                      Hora Fim
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={formData.hora_fim}
                      onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Ativo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label 
                    htmlFor="ativo"
                    style={{
                      fontSize: '14px',
                      color: darkMode ? '#ffffff' : '#0f172a',
                      cursor: 'pointer',
                    }}
                  >
                    Consultor ativo
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                padding: '20px',
                borderTop: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
              }}>
                <button type="button" onClick={handleCloseModal} style={buttonSecondary}>
                  Cancelar
                </button>
                <button type="submit" style={buttonPrimary} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check style={{ width: '16px', height: '16px' }} />
                      {editingConsultor ? 'Salvar' : 'Criar'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
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