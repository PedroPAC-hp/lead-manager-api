import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { Settings, Save, Bell, Clock, Database, Shield, RefreshCw, Trash2, Download, Upload, Server, Zap } from 'lucide-react';

export default function Configuracoes() {
  const { darkMode, toggleTheme } = useTheme();
  const toast = useToast();

  const [config, setConfig] = useState({
    bitrix_webhook: '',
    bitrix_timeout: 30,
    horarios_disparo: ['08:00', '11:00', '14:00', '17:00'],
    disparo_automatico: false,
    notificar_envio: true,
    notificar_erro: true,
    remover_duplicados: true,
    limite_lotes: 20,
  });

  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('geral');

  const cardStyle = { backgroundColor: darkMode ? '#1e293b' : '#ffffff', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '12px' };
  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, backgroundColor: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#fff' : '#0f172a', fontSize: '13px', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '500', color: darkMode ? '#94a3b8' : '#64748b', marginBottom: '6px' };

  useEffect(() => {
    const saved = localStorage.getItem('leadmanager_config');
    if (saved) setConfig(prev => ({ ...prev, ...JSON.parse(saved) }));
  }, []);

  const saveConfig = () => {
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem('leadmanager_config', JSON.stringify(config));
      toast.success('Configurações salvas!');
      setSaving(false);
    }, 500);
  };

  const exportData = () => {
    const data = { config, lotes: JSON.parse(localStorage.getItem('leadmanager_lotes') || '[]'), exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `leadmanager_backup_${new Date().toISOString().split('T')[0]}.json`; link.click();
    toast.success('Backup exportado!');
  };

  const importData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result);
        if (data.config) { setConfig(data.config); localStorage.setItem('leadmanager_config', JSON.stringify(data.config)); }
        if (data.lotes) localStorage.setItem('leadmanager_lotes', JSON.stringify(data.lotes));
        toast.success('Backup importado!');
      } catch { toast.error('Arquivo inválido'); }
    };
    reader.readAsText(file);
  };

  const clearLotes = () => {
    if (window.confirm('Limpar todos os lotes salvos?')) {
      localStorage.removeItem('leadmanager_lotes');
      toast.success('Lotes removidos');
    }
  };

  const Section = ({ id, icon: Icon, title, children }) => (
    <div style={{ ...cardStyle, marginBottom: '16px' }}>
      <div onClick={() => setActiveSection(activeSection === id ? '' : id)} style={{ padding: '14px 16px', borderBottom: activeSection === id ? `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Icon style={{ width: '18px', height: '18px', color: '#3b82f6' }} />
        <span style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#fff' : '#0f172a', flex: 1 }}>{title}</span>
        <span style={{ fontSize: '18px', color: darkMode ? '#64748b' : '#94a3b8' }}>{activeSection === id ? '−' : '+'}</span>
      </div>
      {activeSection === id && <div style={{ padding: '16px' }}>{children}</div>}
    </div>
  );

  const Toggle = ({ label, desc, value, onChange }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
      <div><p style={{ fontSize: '13px', fontWeight: '500', color: darkMode ? '#fff' : '#0f172a', margin: 0 }}>{label}</p>{desc && <p style={{ fontSize: '11px', color: darkMode ? '#64748b' : '#94a3b8', margin: '2px 0 0 0' }}>{desc}</p>}</div>
      <button onClick={onChange} style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', backgroundColor: value ? '#3b82f6' : (darkMode ? '#334155' : '#e2e8f0'), cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
        <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: '3px', left: value ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </button>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: darkMode ? '#fff' : '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}><Settings style={{ width: '28px', height: '28px', color: '#64748b' }} />Configurações</h1>
          <p style={{ color: darkMode ? '#94a3b8' : '#64748b', marginTop: '4px', fontSize: '14px' }}>Personalize o sistema</p>
        </div>
        <button onClick={saveConfig} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
          {saving ? <RefreshCw style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: '14px', height: '14px' }} />}
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <Section id="geral" icon={Settings} title="Geral">
        <Toggle label="Tema Escuro" desc="Alterna entre modo claro e escuro" value={darkMode} onChange={toggleTheme} />
        <div style={{ paddingTop: '12px' }}>
          <label style={labelStyle}>Limite de Lotes Salvos</label>
          <input type="number" value={config.limite_lotes} onChange={e => setConfig({ ...config, limite_lotes: parseInt(e.target.value) || 20 })} style={{ ...inputStyle, width: '120px' }} min="5" max="100" />
          <p style={{ fontSize: '11px', color: darkMode ? '#64748b' : '#94a3b8', marginTop: '4px' }}>Máximo de lotes mantidos no histórico local</p>
        </div>
      </Section>

      <Section id="bitrix" icon={Server} title="Integração Bitrix24">
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Webhook URL</label>
          <input type="text" value={config.bitrix_webhook} onChange={e => setConfig({ ...config, bitrix_webhook: e.target.value })} style={inputStyle} placeholder="https://seu-dominio.bitrix24.com/rest/..." />
          <p style={{ fontSize: '11px', color: darkMode ? '#64748b' : '#94a3b8', marginTop: '4px' }}>URL do webhook (configurado no backend)</p>
        </div>
        <div>
          <label style={labelStyle}>Timeout (segundos)</label>
          <input type="number" value={config.bitrix_timeout} onChange={e => setConfig({ ...config, bitrix_timeout: parseInt(e.target.value) || 30 })} style={{ ...inputStyle, width: '120px' }} min="10" max="120" />
        </div>
      </Section>

      <Section id="disparo" icon={Clock} title="Horários de Disparo">
        <Toggle label="Disparo Automático" desc="Envia leads automaticamente nos horários" value={config.disparo_automatico} onChange={() => setConfig({ ...config, disparo_automatico: !config.disparo_automatico })} />
        <div style={{ paddingTop: '12px' }}>
          <label style={labelStyle}>Horários</label>
          <input type="text" value={config.horarios_disparo.join(', ')} onChange={e => setConfig({ ...config, horarios_disparo: e.target.value.split(',').map(h => h.trim()).filter(h => h) })} style={inputStyle} placeholder="08:00, 11:00, 14:00, 17:00" />
        </div>
        <div style={{ marginTop: '12px', padding: '12px', borderRadius: '8px', backgroundColor: darkMode ? '#0f172a' : '#f8fafc' }}>
          <p style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', margin: 0 }}>⚡ Horários configurados:</p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            {config.horarios_disparo.map((h, i) => (
              <span key={i} style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: darkMode ? '#334155' : '#e2e8f0', fontSize: '12px', color: darkMode ? '#fff' : '#0f172a', fontWeight: '500' }}>{h}</span>
            ))}
          </div>
        </div>
      </Section>

      <Section id="notificacoes" icon={Bell} title="Notificações">
        <Toggle label="Notificar Envios" desc="Exibir toast ao enviar leads" value={config.notificar_envio} onChange={() => setConfig({ ...config, notificar_envio: !config.notificar_envio })} />
        <Toggle label="Notificar Erros" desc="Exibir toast em caso de erro" value={config.notificar_erro} onChange={() => setConfig({ ...config, notificar_erro: !config.notificar_erro })} />
      </Section>

      <Section id="processamento" icon={Zap} title="Processamento">
        <Toggle label="Remover Duplicados" desc="Remove leads com mesmo celular" value={config.remover_duplicados} onChange={() => setConfig({ ...config, remover_duplicados: !config.remover_duplicados })} />
      </Section>

      <Section id="dados" icon={Database} title="Dados e Backup">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <button onClick={exportData} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '8px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, backgroundColor: 'transparent', color: darkMode ? '#fff' : '#0f172a', fontSize: '12px', cursor: 'pointer' }}>
            <Download style={{ width: '16px', height: '16px' }} />Exportar
          </button>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '8px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, backgroundColor: 'transparent', color: darkMode ? '#fff' : '#0f172a', fontSize: '12px', cursor: 'pointer' }}>
            <Upload style={{ width: '16px', height: '16px' }} />Importar
            <input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} />
          </label>
          <button onClick={clearLotes} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '8px', border: '1px solid #ef4444', backgroundColor: 'transparent', color: '#ef4444', fontSize: '12px', cursor: 'pointer' }}>
            <Trash2 style={{ width: '16px', height: '16px' }} />Limpar
          </button>
        </div>
      </Section>

      <Section id="sobre" icon={Shield} title="Sobre">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div><p style={{ fontSize: '11px', color: darkMode ? '#64748b' : '#94a3b8', margin: 0 }}>Versão</p><p style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#fff' : '#0f172a', margin: '4px 0 0 0' }}>1.0.0</p></div>
          <div><p style={{ fontSize: '11px', color: darkMode ? '#64748b' : '#94a3b8', margin: 0 }}>Stack</p><p style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#fff' : '#0f172a', margin: '4px 0 0 0' }}>FastAPI + React</p></div>
        </div>
      </Section>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
