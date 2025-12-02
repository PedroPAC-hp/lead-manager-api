import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { produtosService, consultoresService } from '../services/api';
import { 
  Package, Plus, Edit2, Trash2, Loader2, 
  X, Check, Users, Filter, Settings
} from 'lucide-react';

export default function Produtos() {
  const { darkMode } = useTheme();
  const [produtos, setProdutos] = useState([]);
  const [consultores, setConsultores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConsultoresModal, setShowConsultoresModal] = useState(false);
  const [editingProduto, setEditingProduto] = useState(null);
  const [selectedProduto, setSelectedProduto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'pos',
    descricao: '',
    ativo: true,
    filtro_inscrito_por: { valores_permitidos: ['6111 DIGITAL'], modo: 'whitelist' },
    filtro_status: { remover: ['PAGO'] },
    bitrix_company_title: 'Unicesumar',
  });

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

  const tipoColors = {
    pos: { bg: '#3b82f6', label: 'Pós-Graduação' },
    tec: { bg: '#22c55e', label: 'Tecnólogo' },
    profissionalizante: { bg: '#a855f7', label: 'Profissionalizante' },
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [produtosData, consultoresData] = await Promise.all([
        produtosService.list(),
        consultoresService.list(),
      ]);
      setProdutos(produtosData);
      setConsultores(consultoresData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (produto = null) => {
    if (produto) {
      setEditingProduto(produto);
      setFormData({
        nome: produto.nome,
        tipo: produto.tipo,
        descricao: produto.descricao || '',
        ativo: produto.ativo,
        filtro_inscrito_por: produto.filtro_inscrito_por || { valores_permitidos: ['6111 DIGITAL'], modo: 'whitelist' },
        filtro_status: produto.filtro_status || { remover: ['PAGO'] },
        bitrix_company_title: produto.bitrix_company_title || 'Unicesumar',
      });
    } else {
      setEditingProduto(null);
      setFormData({
        nome: '',
        tipo: 'pos',
        descricao: '',
        ativo: true,
        filtro_inscrito_por: { valores_permitidos: ['6111 DIGITAL'], modo: 'whitelist' },
        filtro_status: { remover: ['PAGO'] },
        bitrix_company_title: 'Unicesumar',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduto(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingProduto) {
        await produtosService.update(editingProduto.id, formData);
      } else {
        await produtosService.create(formData);
      }
      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert(error.response?.data?.detail || 'Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, nome) => {
    if (!confirm(`Tem certeza que deseja excluir "${nome}"?`)) return;
    try {
      await produtosService.delete(id);
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      alert('Erro ao excluir produto');
    }
  };

  const handleOpenConsultores = (produto) => {
    setSelectedProduto(produto);
    setShowConsultoresModal(true);
  };

  const handleToggleConsultor = async (consultorId) => {
    if (!selectedProduto) return;
    try {
      const isAssociated = selectedProduto.consultores_ids?.includes(consultorId);
      if (isAssociated) {
        await produtosService.removeConsultor(selectedProduto.id, consultorId);
      } else {
        await produtosService.addConsultor(selectedProduto.id, consultorId);
      }
      await loadData();
      const updated = await produtosService.get(selectedProduto.id);
      setSelectedProduto(updated);
    } catch (error) {
      console.error('Erro ao atualizar consultor:', error);
    }
  };

  const getConsultoresCount = (produto) => {
    return produto.consultores_ids?.length || 0;
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Package style={{ width: '28px', height: '28px', color: '#22c55e' }} />
            Produtos
          </h1>
          <p style={{ color: darkMode ? '#94a3b8' : '#64748b', marginTop: '4px', fontSize: '14px' }}>
            Configure os produtos e seus filtros de leads
          </p>
        </div>
        <button style={buttonPrimary} onClick={() => handleOpenModal()}>
          <Plus style={{ width: '18px', height: '18px' }} />
          Novo Produto
        </button>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div style={{ ...cardStyle, padding: '48px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b' }}>
          <Loader2 style={{ width: '32px', height: '32px', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '12px' }}>Carregando produtos...</p>
        </div>
      ) : produtos.length === 0 ? (
        <div style={{ ...cardStyle, padding: '48px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b' }}>
          <Package style={{ width: '48px', height: '48px', margin: '0 auto', opacity: 0.5 }} />
          <p style={{ marginTop: '12px' }}>Nenhum produto cadastrado</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
          {produtos.map((produto) => (
            <div key={produto.id} style={{ ...cardStyle, overflow: 'hidden' }}>
              {/* Card Header */}
              <div style={{ padding: '16px', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: tipoColors[produto.tipo]?.bg || '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package style={{ width: '20px', height: '20px', color: '#ffffff' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>{produto.nome}</h3>
                    <span style={{ display: 'inline-block', marginTop: '4px', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '500', backgroundColor: `${tipoColors[produto.tipo]?.bg}20`, color: tipoColors[produto.tipo]?.bg }}>
                      {tipoColors[produto.tipo]?.label || produto.tipo}
                    </span>
                  </div>
                </div>
                <span style={{ padding: '4px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '500', backgroundColor: produto.ativo ? (darkMode ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7') : (darkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2'), color: produto.ativo ? '#22c55e' : '#ef4444' }}>
                  {produto.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              {/* Card Body */}
              <div style={{ padding: '16px' }}>
                {produto.descricao && (
                  <p style={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b', margin: '0 0 12px 0' }}>{produto.descricao}</p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                    <Users style={{ width: '14px', height: '14px' }} />
                    <span>{getConsultoresCount(produto)} consultor(es)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                    <Filter style={{ width: '14px', height: '14px' }} />
                    <span>Filtro: {produto.filtro_inscrito_por?.valores_permitidos?.join(', ') || 'Nenhum'}</span>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div style={{ padding: '12px 16px', borderTop: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, display: 'flex', gap: '8px' }}>
                <button onClick={() => handleOpenConsultores(produto)} style={{ ...buttonSecondary, flex: 1, justifyContent: 'center', padding: '8px' }}>
                  <Users style={{ width: '16px', height: '16px' }} />
                  Consultores
                </button>
                <button onClick={() => handleOpenModal(produto)} style={{ padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: darkMode ? '#0f172a' : '#f1f5f9', color: '#3b82f6', cursor: 'pointer' }} title="Editar">
                  <Edit2 style={{ width: '16px', height: '16px' }} />
                </button>
                <button onClick={() => handleDelete(produto.id, produto.nome)} style={{ padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: darkMode ? '#0f172a' : '#f1f5f9', color: '#ef4444', cursor: 'pointer' }} title="Excluir">
                  <Trash2 style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Produto */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ ...cardStyle, width: '100%', maxWidth: '540px', maxHeight: '90vh', overflow: 'auto', margin: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>
                {editingProduto ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button onClick={handleCloseModal} style={{ padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: darkMode ? '#94a3b8' : '#64748b', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: darkMode ? '#94a3b8' : '#64748b', marginBottom: '6px' }}>Nome *</label>
                  <input type="text" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} style={inputStyle} placeholder="Nome do produto" required />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: darkMode ? '#94a3b8' : '#64748b', marginBottom: '6px' }}>Tipo *</label>
                  <select value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} style={inputStyle}>
                    <option value="pos">Pós-Graduação</option>
                    <option value="tec">Tecnólogo</option>
                    <option value="profissionalizante">Profissionalizante</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: darkMode ? '#94a3b8' : '#64748b', marginBottom: '6px' }}>Descrição</label>
                  <textarea value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Descrição do produto" />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: darkMode ? '#94a3b8' : '#64748b', marginBottom: '6px' }}>Título no Bitrix</label>
                  <input type="text" value={formData.bitrix_company_title} onChange={(e) => setFormData({ ...formData, bitrix_company_title: e.target.value })} style={inputStyle} placeholder="Ex: Unicesumar Pós-Graduação" />
                </div>

                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: darkMode ? '#0f172a' : '#f8fafc', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: darkMode ? '#ffffff' : '#0f172a', fontWeight: '500', fontSize: '14px' }}>
                    <Settings style={{ width: '16px', height: '16px' }} />
                    Filtros
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b', marginBottom: '4px' }}>Inscrito Por (separar por vírgula)</label>
                    <input type="text" value={formData.filtro_inscrito_por.valores_permitidos.join(', ')} onChange={(e) => setFormData({ ...formData, filtro_inscrito_por: { ...formData.filtro_inscrito_por, valores_permitidos: e.target.value.split(',').map(v => v.trim()).filter(v => v) } })} style={{ ...inputStyle, fontSize: '13px' }} placeholder="Ex: 6111 DIGITAL, OUTRO" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b', marginBottom: '4px' }}>Status a Remover (separar por vírgula)</label>
                    <input type="text" value={formData.filtro_status.remover.join(', ')} onChange={(e) => setFormData({ ...formData, filtro_status: { remover: e.target.value.split(',').map(v => v.trim()).filter(v => v) } })} style={{ ...inputStyle, fontSize: '13px' }} placeholder="Ex: PAGO, CANCELADO" />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input type="checkbox" id="ativo" checked={formData.ativo} onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                  <label htmlFor="ativo" style={{ fontSize: '14px', color: darkMode ? '#ffffff' : '#0f172a', cursor: 'pointer' }}>Produto ativo</label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '20px', borderTop: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
                <button type="button" onClick={handleCloseModal} style={buttonSecondary}>Cancelar</button>
                <button type="submit" style={buttonPrimary} disabled={saving}>
                  {saving ? (<><Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />Salvando...</>) : (<><Check style={{ width: '16px', height: '16px' }} />{editingProduto ? 'Salvar' : 'Criar'}</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Consultores */}
      {showConsultoresModal && selectedProduto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ ...cardStyle, width: '100%', maxWidth: '480px', margin: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>Consultores</h2>
                <p style={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b', margin: '4px 0 0 0' }}>{selectedProduto.nome}</p>
              </div>
              <button onClick={() => setShowConsultoresModal(false)} style={{ padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: darkMode ? '#94a3b8' : '#64748b', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <div style={{ padding: '8px', maxHeight: '400px', overflow: 'auto' }}>
              {consultores.length === 0 ? (
                <p style={{ padding: '24px', textAlign: 'center', color: darkMode ? '#94a3b8' : '#64748b' }}>Nenhum consultor cadastrado</p>
              ) : (
                consultores.map((consultor) => {
                  const isAssociated = selectedProduto.consultores_ids?.includes(consultor.id);
                  return (
                    <div key={consultor.id} onClick={() => handleToggleConsultor(consultor.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: isAssociated ? (darkMode ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff') : 'transparent', border: `1px solid ${isAssociated ? '#3b82f6' : 'transparent'}`, marginBottom: '4px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: isAssociated ? '#3b82f6' : (darkMode ? '#334155' : '#e2e8f0'), display: 'flex', alignItems: 'center', justifyContent: 'center', color: isAssociated ? '#ffffff' : (darkMode ? '#94a3b8' : '#64748b'), fontWeight: '600', fontSize: '14px' }}>
                        {consultor.nome.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: '500', color: darkMode ? '#ffffff' : '#0f172a', margin: 0, fontSize: '14px' }}>{consultor.nome}</p>
                        <p style={{ fontSize: '12px', color: darkMode ? '#64748b' : '#94a3b8', margin: '2px 0 0 0' }}>{consultor.hora_inicio}h - {consultor.hora_fim}h</p>
                      </div>
                      <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: isAssociated ? '#3b82f6' : (darkMode ? '#334155' : '#e2e8f0'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isAssociated && <Check style={{ width: '14px', height: '14px', color: '#ffffff' }} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ padding: '16px 20px', borderTop: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowConsultoresModal(false)} style={buttonPrimary}>Concluir</button>
            </div>
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
