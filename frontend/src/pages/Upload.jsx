import { useState, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { produtosService, leadsService } from '../services/api';
import { useEffect } from 'react';
import { 
  Upload, FileSpreadsheet, X, Check, Loader2, 
  AlertCircle, ChevronRight, Eye, Filter, Users
} from 'lucide-react';

export default function UploadPage() {
  const { darkMode } = useTheme();
  const [produtos, setProdutos] = useState([]);
  const [selectedProduto, setSelectedProduto] = useState(null);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [processResult, setProcessResult] = useState(null);
  const [step, setStep] = useState(1);

  const cardStyle = {
    backgroundColor: darkMode ? '#1e293b' : '#ffffff',
    border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
    borderRadius: '12px',
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

  useEffect(() => {
    loadProdutos();
  }, []);

  const loadProdutos = async () => {
    try {
      const data = await produtosService.list(true);
      setProdutos(data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.xls') || droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.html')) {
        setFile(droppedFile);
      } else {
        alert('Por favor, selecione um arquivo XLS, XLSX ou HTML');
      }
    }
  }, []);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedProduto) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const result = await leadsService.upload(selectedProduto.id, file);
      setUploadResult(result);
      setStep(3);
    } catch (error) {
      console.error('Erro no upload:', error);
      alert(error.response?.data?.detail || 'Erro ao fazer upload');
    } finally {
      setUploading(false);
    }
  };

  const handleProcess = async () => {
    if (!uploadResult?.lote_id) return;
    setProcessing(true);
    try {
      const result = await leadsService.processar(uploadResult.lote_id);
      setProcessResult(result);
      setStep(4);
    } catch (error) {
      console.error('Erro ao processar:', error);
      alert(error.response?.data?.detail || 'Erro ao processar lote');
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setSelectedProduto(null);
    setUploadResult(null);
    setProcessResult(null);
    setStep(1);
  };

  const StepIndicator = ({ number, title, active, completed }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: completed ? '#22c55e' : active ? '#3b82f6' : (darkMode ? '#334155' : '#e2e8f0'),
        color: completed || active ? '#ffffff' : (darkMode ? '#64748b' : '#94a3b8'),
        fontWeight: '600',
        fontSize: '14px',
      }}>
        {completed ? <Check style={{ width: '16px', height: '16px' }} /> : number}
      </div>
      <span style={{
        fontSize: '14px',
        fontWeight: active ? '600' : '400',
        color: active ? (darkMode ? '#ffffff' : '#0f172a') : (darkMode ? '#64748b' : '#94a3b8'),
      }}>
        {title}
      </span>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Upload style={{ width: '28px', height: '28px', color: '#a855f7' }} />
          Upload de Leads
        </h1>
        <p style={{ color: darkMode ? '#94a3b8' : '#64748b', marginTop: '4px', fontSize: '14px' }}>
          Faça upload de arquivos XLS do Portal NEAD
        </p>
      </div>

      {/* Steps */}
      <div style={{ ...cardStyle, padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <StepIndicator number={1} title="Selecionar Produto" active={step === 1} completed={step > 1} />
          <ChevronRight style={{ width: '20px', height: '20px', color: darkMode ? '#334155' : '#e2e8f0' }} />
          <StepIndicator number={2} title="Upload do Arquivo" active={step === 2} completed={step > 2} />
          <ChevronRight style={{ width: '20px', height: '20px', color: darkMode ? '#334155' : '#e2e8f0' }} />
          <StepIndicator number={3} title="Processar" active={step === 3} completed={step > 3} />
          <ChevronRight style={{ width: '20px', height: '20px', color: darkMode ? '#334155' : '#e2e8f0' }} />
          <StepIndicator number={4} title="Resultado" active={step === 4} completed={false} />
        </div>
      </div>

      {/* Step 1: Selecionar Produto */}
      {step === 1 && (
        <div style={cardStyle}>
          <div style={{ padding: '20px', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>
              Selecione o Produto
            </h2>
            <p style={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b', margin: '4px 0 0 0' }}>
              Escolha para qual produto deseja fazer o upload dos leads
            </p>
          </div>
          <div style={{ padding: '16px' }}>
            {produtos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                <AlertCircle style={{ width: '48px', height: '48px', margin: '0 auto', opacity: 0.5 }} />
                <p style={{ marginTop: '12px' }}>Nenhum produto ativo encontrado</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {produtos.map((produto) => (
                  <div
                    key={produto.id}
                    onClick={() => { setSelectedProduto(produto); setStep(2); }}
                    style={{
                      padding: '16px',
                      borderRadius: '10px',
                      border: `2px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: darkMode ? '#0f172a' : '#f8fafc',
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = darkMode ? '#334155' : '#e2e8f0'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: produto.tipo === 'pos' ? '#3b82f6' : produto.tipo === 'tec' ? '#22c55e' : '#a855f7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <FileSpreadsheet style={{ width: '20px', height: '20px', color: '#ffffff' }} />
                      </div>
                      <div>
                        <p style={{ fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>{produto.nome}</p>
                        <p style={{ fontSize: '12px', color: darkMode ? '#64748b' : '#94a3b8', margin: '2px 0 0 0' }}>
                          {produto.consultores_ids?.length || 0} consultores
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Upload */}
      {step === 2 && (
        <div style={cardStyle}>
          <div style={{ padding: '20px', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>
                  Upload do Arquivo
                </h2>
                <p style={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b', margin: '4px 0 0 0' }}>
                  Produto: <strong style={{ color: '#3b82f6' }}>{selectedProduto?.nome}</strong>
                </p>
              </div>
              <button onClick={() => setStep(1)} style={buttonSecondary}>Voltar</button>
            </div>
          </div>
          <div style={{ padding: '24px' }}>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragActive ? '#3b82f6' : (darkMode ? '#334155' : '#e2e8f0')}`,
                borderRadius: '12px',
                padding: '48px',
                textAlign: 'center',
                backgroundColor: dragActive ? (darkMode ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff') : 'transparent',
                transition: 'all 0.2s',
              }}
            >
              {file ? (
                <div>
                  <FileSpreadsheet style={{ width: '48px', height: '48px', color: '#22c55e', margin: '0 auto' }} />
                  <p style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', marginTop: '16px' }}>
                    {file.name}
                  </p>
                  <p style={{ fontSize: '13px', color: darkMode ? '#64748b' : '#94a3b8', marginTop: '4px' }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    onClick={() => setFile(null)}
                    style={{ ...buttonSecondary, margin: '16px auto 0', padding: '8px 16px' }}
                  >
                    <X style={{ width: '16px', height: '16px' }} />
                    Remover
                  </button>
                </div>
              ) : (
                <div>
                  <Upload style={{ width: '48px', height: '48px', color: darkMode ? '#64748b' : '#94a3b8', margin: '0 auto' }} />
                  <p style={{ fontSize: '16px', fontWeight: '500', color: darkMode ? '#ffffff' : '#0f172a', marginTop: '16px' }}>
                    Arraste o arquivo aqui
                  </p>
                  <p style={{ fontSize: '13px', color: darkMode ? '#64748b' : '#94a3b8', marginTop: '4px' }}>
                    ou clique para selecionar
                  </p>
                  <input
                    type="file"
                    accept=".xls,.xlsx,.html"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    style={{ ...buttonPrimary, margin: '16px auto 0', display: 'inline-flex', cursor: 'pointer' }}
                  >
                    Selecionar Arquivo
                  </label>
                  <p style={{ fontSize: '12px', color: darkMode ? '#64748b' : '#94a3b8', marginTop: '12px' }}>
                    Formatos aceitos: XLS, XLSX, HTML
                  </p>
                </div>
              )}
            </div>

            {file && (
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={handleUpload} style={buttonPrimary} disabled={uploading}>
                  {uploading ? (
                    <><Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />Enviando...</>
                  ) : (
                    <><Upload style={{ width: '16px', height: '16px' }} />Fazer Upload</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Preview e Processar */}
      {step === 3 && uploadResult && (
        <div style={cardStyle}>
          <div style={{ padding: '20px', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>
              Upload Concluído
            </h2>
            <p style={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b', margin: '4px 0 0 0' }}>
              {uploadResult.message}
            </p>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: darkMode ? '#0f172a' : '#f8fafc', textAlign: 'center' }}>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6', margin: 0 }}>{uploadResult.total_registros}</p>
                <p style={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b', margin: '4px 0 0 0' }}>Registros carregados</p>
              </div>
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: darkMode ? '#0f172a' : '#f8fafc', textAlign: 'center' }}>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e', margin: 0 }}>{uploadResult.preview?.length || 0}</p>
                <p style={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b', margin: '4px 0 0 0' }}>Preview</p>
              </div>
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: darkMode ? '#0f172a' : '#f8fafc', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', fontWeight: '500', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>{uploadResult.arquivo}</p>
                <p style={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b', margin: '4px 0 0 0' }}>Arquivo</p>
              </div>
            </div>

            {uploadResult.preview && uploadResult.preview.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Eye style={{ width: '16px', height: '16px' }} />
                  Preview dos Leads
                </h3>
                <div style={{ overflow: 'auto', maxHeight: '300px', borderRadius: '8px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: darkMode ? '#0f172a' : '#f8fafc' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Nome</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Celular</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Curso</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '600' }}>Polo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadResult.preview.slice(0, 10).map((lead, index) => (
                        <tr key={index} style={{ borderTop: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
                          <td style={{ padding: '10px 12px', color: darkMode ? '#ffffff' : '#0f172a' }}>{lead.nome || '-'}</td>
                          <td style={{ padding: '10px 12px', color: darkMode ? '#94a3b8' : '#64748b' }}>{lead.celular || '-'}</td>
                          <td style={{ padding: '10px 12px', color: darkMode ? '#94a3b8' : '#64748b' }}>{lead.curso_nome || lead.curso_codigo || '-'}</td>
                          <td style={{ padding: '10px 12px', color: darkMode ? '#94a3b8' : '#64748b' }}>{lead.polo || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={handleReset} style={buttonSecondary}>
                <X style={{ width: '16px', height: '16px' }} />
                Cancelar
              </button>
              <button onClick={handleProcess} style={buttonPrimary} disabled={processing}>
                {processing ? (
                  <><Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />Processando...</>
                ) : (
                  <><Filter style={{ width: '16px', height: '16px' }} />Processar Lote</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Resultado */}
      {step === 4 && processResult && (
        <div style={cardStyle}>
          <div style={{ padding: '20px', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, backgroundColor: darkMode ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check style={{ width: '20px', height: '20px', color: '#ffffff' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>
                  Processamento Concluído!
                </h2>
                <p style={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b', margin: '4px 0 0 0' }}>
                  Lote ID: {processResult.lote_id}
                </p>
              </div>
            </div>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: darkMode ? '#0f172a' : '#f8fafc', textAlign: 'center' }}>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6', margin: 0 }}>{processResult.total_processados}</p>
                <p style={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b', margin: '4px 0 0 0' }}>Total</p>
              </div>
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: darkMode ? '#0f172a' : '#f8fafc', textAlign: 'center' }}>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e', margin: 0 }}>{processResult.validos}</p>
                <p style={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b', margin: '4px 0 0 0' }}>Válidos</p>
              </div>
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: darkMode ? '#0f172a' : '#f8fafc', textAlign: 'center' }}>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b', margin: 0 }}>{processResult.duplicados}</p>
                <p style={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b', margin: '4px 0 0 0' }}>Duplicados</p>
              </div>
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: darkMode ? '#0f172a' : '#f8fafc', textAlign: 'center' }}>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444', margin: 0 }}>{processResult.filtrados}</p>
                <p style={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b', margin: '4px 0 0 0' }}>Filtrados</p>
              </div>
            </div>

            <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: darkMode ? '#0f172a' : '#f8fafc', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', margin: '0 0 12px 0' }}>
                Filtros Aplicados
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                <p style={{ margin: 0 }}>
                  <strong>Inscrito Por:</strong> {processResult.detalhes?.filtro_inscrito_por?.valores_permitidos?.join(', ') || '-'}
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Status Removidos:</strong> {processResult.detalhes?.filtro_status?.remover?.join(', ') || '-'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={handleReset} style={buttonSecondary}>
                Novo Upload
              </button>
              <button onClick={() => window.location.href = '/enviar'} style={buttonPrimary}>
                <Users style={{ width: '16px', height: '16px' }} />
                Ir para Enviar Leads
              </button>
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
