import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { produtosService, leadsService } from '../services/api';
import { 
  Upload, FileSpreadsheet, X, Check, Loader2, 
  AlertCircle, ChevronRight, Filter, Clock, Trash2, ArrowRight, Settings
} from 'lucide-react';

export default function UploadPage() {
  const { darkMode } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  
  const [produtos, setProdutos] = useState([]);
  const [selectedProduto, setSelectedProduto] = useState(null);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [processResult, setProcessResult] = useState(null);
  const [step, setStep] = useState(1);
  const [showLotesRecentes, setShowLotesRecentes] = useState(false);
  const [lotes, setLotes] = useState([]);
  
  // Filtros editáveis
  const [filtroInscritoPor, setFiltroInscritoPor] = useState('');
  const [filtroStatusRemover, setFiltroStatusRemover] = useState('');
  const [showFiltros, setShowFiltros] = useState(false);

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

  const buttonSecondary = {
    display: 'inline-flex',
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
    loadLotes();
  }, []);

  useEffect(() => {
    if (selectedProduto) {
      setFiltroInscritoPor(selectedProduto.filtro_inscrito_por?.valores_permitidos?.join(', ') || '');
      setFiltroStatusRemover(selectedProduto.filtro_status?.remover?.join(', ') || '');
    }
  }, [selectedProduto]);

  const loadProdutos = async () => {
    try {
      const data = await produtosService.list(true);
      setProdutos(data);
    } catch (error) {
      toast.error('Erro ao carregar produtos');
    }
  };

  const loadLotes = () => {
    try {
      const saved = localStorage.getItem('leadmanager_lotes');
      if (saved) setLotes(JSON.parse(saved));
    } catch (e) {}
  };

  const saveLote = (lote) => {
    const novoLote = { ...lote, id: lote.lote_id || lote.id, criadoEm: new Date().toISOString() };
    const updated = [novoLote, ...lotes.filter(l => l.id !== novoLote.id)].slice(0, 20);
    setLotes(updated);
    localStorage.setItem('leadmanager_lotes', JSON.stringify(updated));
  };

  const updateLote = (loteId, dados) => {
    const updated = lotes.map(l => l.id === loteId ? { ...l, ...dados } : l);
    setLotes(updated);
    localStorage.setItem('leadmanager_lotes', JSON.stringify(updated));
  };

  const removeLote = (loteId) => {
    const updated = lotes.filter(l => l.id !== loteId);
    setLotes(updated);
    localStorage.setItem('leadmanager_lotes', JSON.stringify(updated));
    toast.success('Lote removido');
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      const f = e.dataTransfer.files[0];
      if (f.name.match(/\.(xls|xlsx|html)$/i)) {
        setFile(f);
        toast.success(`Arquivo "${f.name}" selecionado`);
      } else {
        toast.error('Formato inválido. Use XLS, XLSX ou HTML');
      }
    }
  }, [toast]);

  const handleFileSelect = (e) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      toast.success(`Arquivo selecionado`);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedProduto) return;
    setUploading(true);
    try {
      const result = await leadsService.upload(selectedProduto.id, file);
      setUploadResult(result);
      saveLote({
        lote_id: result.lote_id,
        produto_id: selectedProduto.id,
        produto_nome: selectedProduto.nome,
        arquivo: result.arquivo,
        total_registros: result.total_registros,
        status: 'upload',
      });
      toast.success(`${result.total_registros} registros carregados`);
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro no upload');
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
      updateLote(uploadResult.lote_id, {
        status: 'processado',
        validos: result.validos,
        duplicados: result.duplicados,
        filtrados: result.filtrados,
        total_processados: result.total_processados,
      });
      toast.success(`Processamento concluído: ${result.validos} leads válidos`);
      setStep(4);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao processar');
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
    setShowFiltros(false);
  };

  const handleContinuarLote = (lote) => {
    setUploadResult({ lote_id: lote.id, arquivo: lote.arquivo, total_registros: lote.total_registros });
    const produto = produtos.find(p => p.id === lote.produto_id);
    if (produto) setSelectedProduto(produto);
    if (lote.status === 'upload') setStep(3);
    else if (lote.status === 'processado') {
      setProcessResult({ validos: lote.validos, duplicados: lote.duplicados, filtrados: lote.filtrados, total_processados: lote.total_processados });
      setStep(4);
    }
    setShowLotesRecentes(false);
    toast.info(`Lote carregado`);
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  const StepIndicator = ({ number, title, active, completed }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: completed ? '#22c55e' : active ? '#3b82f6' : (darkMode ? '#334155' : '#e2e8f0'),
        color: completed || active ? '#ffffff' : (darkMode ? '#64748b' : '#94a3b8'),
        fontWeight: '600', fontSize: '12px',
      }}>
        {completed ? <Check style={{ width: '14px', height: '14px' }} /> : number}
      </div>
      <span style={{ fontSize: '13px', fontWeight: active ? '600' : '400', color: active ? (darkMode ? '#ffffff' : '#0f172a') : (darkMode ? '#64748b' : '#94a3b8') }}>
        {title}
      </span>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: darkMode ? '#ffffff' : '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Upload style={{ width: '28px', height: '28px', color: '#a855f7' }} />
            Upload de Leads
          </h1>
          <p style={{ color: darkMode ? '#94a3b8' : '#64748b', marginTop: '4px', fontSize: '14px' }}>
            Faça upload de arquivos XLS do Portal NEAD
          </p>
        </div>
        {lotes.length > 0 && (
          <button onClick={() => setShowLotesRecentes(!showLotesRecentes)} style={{ ...buttonSecondary, position: 'relative' }}>
            <Clock style={{ width: '16px', height: '16px' }} />
            Lotes Recentes
            <span style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#3b82f6', color: '#fff', fontSize: '10px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {lotes.length}
            </span>
          </button>
        )}
      </div>

      {/* Lotes Recentes */}
      {showLotesRecentes && (
        <div style={{ ...cardStyle, padding: '16px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', margin: '0 0 12px 0' }}>Continuar de onde parou</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflow: 'auto' }}>
            {lotes.map((lote) => (
              <div key={lote.id} onClick={() => handleContinuarLote(lote)} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '8px',
                backgroundColor: darkMode ? '#0f172a' : '#f8fafc', cursor: 'pointer', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
              }}>
                <FileSpreadsheet style={{ width: '20px', height: '20px', color: lote.status === 'enviado' ? '#22c55e' : lote.status === 'processado' ? '#3b82f6' : '#f59e0b' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: '500', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>{lote.arquivo || 'Sem nome'}</p>
                  <p style={{ fontSize: '11px', color: darkMode ? '#64748b' : '#94a3b8', margin: 0 }}>{lote.produto_nome} • {formatDate(lote.criadoEm)}</p>
                </div>
                <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '500', textTransform: 'uppercase',
                  backgroundColor: lote.status === 'enviado' ? 'rgba(34,197,94,0.2)' : lote.status === 'processado' ? 'rgba(59,130,246,0.2)' : 'rgba(245,158,11,0.2)',
                  color: lote.status === 'enviado' ? '#22c55e' : lote.status === 'processado' ? '#3b82f6' : '#f59e0b',
                }}>{lote.status}</span>
                <button onClick={(e) => { e.stopPropagation(); removeLote(lote.id); }} style={{ padding: '4px', border: 'none', background: 'transparent', color: darkMode ? '#64748b' : '#94a3b8', cursor: 'pointer' }}>
                  <Trash2 style={{ width: '14px', height: '14px' }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Steps */}
      <div style={{ ...cardStyle, padding: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <StepIndicator number={1} title="Produto" active={step === 1} completed={step > 1} />
          <ChevronRight style={{ width: '16px', height: '16px', color: darkMode ? '#334155' : '#e2e8f0' }} />
          <StepIndicator number={2} title="Upload" active={step === 2} completed={step > 2} />
          <ChevronRight style={{ width: '16px', height: '16px', color: darkMode ? '#334155' : '#e2e8f0' }} />
          <StepIndicator number={3} title="Processar" active={step === 3} completed={step > 3} />
          <ChevronRight style={{ width: '16px', height: '16px', color: darkMode ? '#334155' : '#e2e8f0' }} />
          <StepIndicator number={4} title="Resultado" active={step === 4} completed={false} />
        </div>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div style={cardStyle}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>Selecione o Produto</h2>
          </div>
          <div style={{ padding: '16px' }}>
            {produtos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                <AlertCircle style={{ width: '40px', height: '40px', margin: '0 auto', opacity: 0.5 }} />
                <p style={{ marginTop: '12px' }}>Nenhum produto ativo</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                {produtos.map((p) => (
                  <div key={p.id} onClick={() => { setSelectedProduto(p); setStep(2); toast.info(`${p.nome} selecionado`); }}
                    style={{ padding: '16px', borderRadius: '10px', border: `2px solid ${darkMode ? '#334155' : '#e2e8f0'}`, cursor: 'pointer', backgroundColor: darkMode ? '#0f172a' : '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: p.tipo === 'pos' ? '#3b82f6' : p.tipo === 'tec' ? '#22c55e' : '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileSpreadsheet style={{ width: '20px', height: '20px', color: '#fff' }} />
                      </div>
                      <div>
                        <p style={{ fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>{p.nome}</p>
                        <p style={{ fontSize: '12px', color: darkMode ? '#64748b' : '#94a3b8', margin: 0 }}>{p.consultores_ids?.length || 0} consultores</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div style={cardStyle}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>Upload do Arquivo</h2>
              <p style={{ fontSize: '12px', color: '#3b82f6', margin: '4px 0 0 0' }}>{selectedProduto?.nome}</p>
            </div>
            <button onClick={() => setStep(1)} style={buttonSecondary}>Voltar</button>
          </div>
          <div style={{ padding: '20px' }}>
            <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              style={{ border: `2px dashed ${dragActive ? '#3b82f6' : (darkMode ? '#334155' : '#e2e8f0')}`, borderRadius: '12px', padding: '40px', textAlign: 'center', backgroundColor: dragActive ? (darkMode ? 'rgba(59,130,246,0.1)' : '#eff6ff') : 'transparent' }}>
              {file ? (
                <div>
                  <FileSpreadsheet style={{ width: '48px', height: '48px', color: '#22c55e', margin: '0 auto' }} />
                  <p style={{ fontSize: '16px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', marginTop: '12px' }}>{file.name}</p>
                  <p style={{ fontSize: '12px', color: darkMode ? '#64748b' : '#94a3b8' }}>{(file.size / 1024).toFixed(1)} KB</p>
                  <button onClick={() => setFile(null)} style={{ ...buttonSecondary, marginTop: '12px', padding: '6px 12px', fontSize: '12px' }}>
                    <X style={{ width: '14px', height: '14px' }} /> Remover
                  </button>
                </div>
              ) : (
                <div>
                  <Upload style={{ width: '48px', height: '48px', color: darkMode ? '#64748b' : '#94a3b8', margin: '0 auto' }} />
                  <p style={{ fontSize: '15px', color: darkMode ? '#ffffff' : '#0f172a', marginTop: '12px' }}>Arraste o arquivo aqui</p>
                  <p style={{ fontSize: '13px', color: darkMode ? '#64748b' : '#94a3b8' }}>ou clique para selecionar</p>
                  <input type="file" accept=".xls,.xlsx,.html" onChange={handleFileSelect} style={{ display: 'none' }} id="file-upload" />
                  <label htmlFor="file-upload" style={{ ...buttonPrimary, marginTop: '12px', cursor: 'pointer' }}>Selecionar Arquivo</label>
                </div>
              )}
            </div>
            {file && (
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={handleUpload} style={buttonPrimary} disabled={uploading}>
                  {uploading ? <><Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> Enviando...</> : <><Upload style={{ width: '16px', height: '16px' }} /> Fazer Upload</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && uploadResult && (
        <div style={cardStyle}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>Upload Concluído</h2>
              <p style={{ fontSize: '12px', color: darkMode ? '#64748b' : '#94a3b8', margin: '4px 0 0 0' }}>{uploadResult.total_registros} registros • {uploadResult.lote_id?.substring(0, 8)}...</p>
            </div>
            <button onClick={() => setShowFiltros(!showFiltros)} style={buttonSecondary}>
              <Settings style={{ width: '14px', height: '14px' }} /> Filtros
            </button>
          </div>
          
          {showFiltros && (
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, backgroundColor: darkMode ? '#0f172a' : '#f8fafc' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', marginBottom: '6px' }}>Inscrito Por (permitidos)</label>
                  <input type="text" value={filtroInscritoPor} onChange={(e) => setFiltroInscritoPor(e.target.value)} style={inputStyle} placeholder="6111 DIGITAL, OUTRO" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', marginBottom: '6px' }}>Status a Remover</label>
                  <input type="text" value={filtroStatusRemover} onChange={(e) => setFiltroStatusRemover(e.target.value)} style={inputStyle} placeholder="PAGO, CANCELADO" />
                </div>
              </div>
            </div>
          )}

          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: darkMode ? '#0f172a' : '#f8fafc', textAlign: 'center' }}>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6', margin: 0 }}>{uploadResult.total_registros}</p>
                <p style={{ fontSize: '12px', color: darkMode ? '#64748b' : '#94a3b8' }}>Registros</p>
              </div>
              <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: darkMode ? '#0f172a' : '#f8fafc', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', fontWeight: '500', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>{uploadResult.arquivo}</p>
                <p style={{ fontSize: '12px', color: darkMode ? '#64748b' : '#94a3b8' }}>Arquivo</p>
              </div>
              <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: darkMode ? '#0f172a' : '#f8fafc', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', fontWeight: '500', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>{selectedProduto?.nome}</p>
                <p style={{ fontSize: '12px', color: darkMode ? '#64748b' : '#94a3b8' }}>Produto</p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={handleReset} style={buttonSecondary}><X style={{ width: '14px', height: '14px' }} /> Cancelar</button>
              <button onClick={handleProcess} style={buttonPrimary} disabled={processing}>
                {processing ? <><Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> Processando...</> : <><Filter style={{ width: '16px', height: '16px' }} /> Processar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4 */}
      {step === 4 && processResult && (
        <div style={cardStyle}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, backgroundColor: darkMode ? 'rgba(34,197,94,0.1)' : '#f0fdf4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check style={{ width: '18px', height: '18px', color: '#fff' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0f172a', margin: 0 }}>Processamento Concluído!</h2>
                <p style={{ fontSize: '12px', color: darkMode ? '#64748b' : '#94a3b8', margin: 0 }}>Lote: {uploadResult?.lote_id?.substring(0, 8)}...</p>
              </div>
            </div>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: darkMode ? '#0f172a' : '#f8fafc', textAlign: 'center' }}>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6', margin: 0 }}>{processResult.total_processados || uploadResult?.total_registros}</p>
                <p style={{ fontSize: '12px', color: darkMode ? '#64748b' : '#94a3b8' }}>Total</p>
              </div>
              <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: darkMode ? '#0f172a' : '#f8fafc', textAlign: 'center' }}>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e', margin: 0 }}>{processResult.validos}</p>
                <p style={{ fontSize: '12px', color: darkMode ? '#64748b' : '#94a3b8' }}>Válidos</p>
              </div>
              <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: darkMode ? '#0f172a' : '#f8fafc', textAlign: 'center' }}>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b', margin: 0 }}>{processResult.duplicados}</p>
                <p style={{ fontSize: '12px', color: darkMode ? '#64748b' : '#94a3b8' }}>Duplicados</p>
              </div>
              <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: darkMode ? '#0f172a' : '#f8fafc', textAlign: 'center' }}>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444', margin: 0 }}>{processResult.filtrados}</p>
                <p style={{ fontSize: '12px', color: darkMode ? '#64748b' : '#94a3b8' }}>Filtrados</p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={handleReset} style={buttonSecondary}>Novo Upload</button>
              <button onClick={() => navigate('/enviar')} style={{ ...buttonPrimary, backgroundColor: '#22c55e' }}>
                <ArrowRight style={{ width: '16px', height: '16px' }} /> Ir para Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
