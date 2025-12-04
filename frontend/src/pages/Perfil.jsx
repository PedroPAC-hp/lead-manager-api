import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { User, Mail, Lock, Save, Eye, EyeOff, Shield, Clock, Calendar, Edit2 } from 'lucide-react';

export default function Perfil() {
  const { user, logout } = useAuth();
  const { darkMode } = useTheme();
  const toast = useToast();

  const [editMode, setEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const cardStyle = { backgroundColor: darkMode ? '#1e293b' : '#ffffff', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, borderRadius: '12px' };
  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, backgroundColor: darkMode ? '#0f172a' : '#fff', color: darkMode ? '#fff' : '#0f172a', fontSize: '13px', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '500', color: darkMode ? '#94a3b8' : '#64748b', marginBottom: '6px' };

  const handleSave = async () => {
    if (form.new_password && form.new_password !== form.confirm_password) {
      toast.error('As senhas não coincidem');
      return;
    }
    if (form.new_password && form.new_password.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres');
      return;
    }
    setSaving(true);
    setTimeout(() => {
      toast.success('Perfil atualizado!');
      setEditMode(false);
      setSaving(false);
      setForm(prev => ({ ...prev, current_password: '', new_password: '', confirm_password: '' }));
    }, 800);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0][0];
  };

  const lotes = JSON.parse(localStorage.getItem('leadmanager_lotes') || '[]');

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: darkMode ? '#fff' : '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <User style={{ width: '28px', height: '28px', color: '#3b82f6' }} />Meu Perfil
        </h1>
        <p style={{ color: darkMode ? '#94a3b8' : '#64748b', marginTop: '4px', fontSize: '14px' }}>Gerencie suas informações</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px' }}>
        {/* Card Perfil */}
        <div style={cardStyle}>
          <div style={{ padding: '24px', textAlign: 'center', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold', margin: '0 auto' }}>
              {getInitials(user?.full_name)}
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: darkMode ? '#fff' : '#0f172a', margin: '12px 0 4px 0' }}>{user?.full_name}</h2>
            <p style={{ fontSize: '13px', color: darkMode ? '#94a3b8' : '#64748b', margin: 0 }}>{user?.email}</p>
            <span style={{ display: 'inline-block', marginTop: '12px', padding: '4px 12px', borderRadius: '20px', backgroundColor: 'rgba(34,197,94,0.2)', color: '#22c55e', fontSize: '11px', fontWeight: '500' }}>
              <Shield style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              Administrador
            </span>
          </div>
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
              <Calendar style={{ width: '16px', height: '16px', color: darkMode ? '#64748b' : '#94a3b8' }} />
              <div>
                <p style={{ fontSize: '11px', color: darkMode ? '#64748b' : '#94a3b8', margin: 0 }}>Membro desde</p>
                <p style={{ fontSize: '13px', color: darkMode ? '#fff' : '#0f172a', margin: '2px 0 0 0' }}>Dezembro 2024</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0' }}>
              <Clock style={{ width: '16px', height: '16px', color: darkMode ? '#64748b' : '#94a3b8' }} />
              <div>
                <p style={{ fontSize: '11px', color: darkMode ? '#64748b' : '#94a3b8', margin: 0 }}>Último acesso</p>
                <p style={{ fontSize: '13px', color: darkMode ? '#fff' : '#0f172a', margin: '2px 0 0 0' }}>Agora</p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div style={cardStyle}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: darkMode ? '#fff' : '#0f172a', margin: 0 }}>Informações da Conta</h3>
            {!editMode ? (
              <button onClick={() => setEditMode(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '6px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, backgroundColor: 'transparent', color: darkMode ? '#94a3b8' : '#64748b', fontSize: '12px', cursor: 'pointer' }}>
                <Edit2 style={{ width: '14px', height: '14px' }} />Editar
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setEditMode(false); setForm({ ...form, current_password: '', new_password: '', confirm_password: '' }); }} style={{ padding: '8px 14px', borderRadius: '6px', border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, backgroundColor: 'transparent', color: darkMode ? '#94a3b8' : '#64748b', fontSize: '12px', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
                  <Save style={{ width: '14px', height: '14px' }} />{saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            )}
          </div>

          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}><User style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />Nome</label>
                <input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} style={{ ...inputStyle, backgroundColor: !editMode ? (darkMode ? '#0f172a' : '#f1f5f9') : inputStyle.backgroundColor }} disabled={!editMode} />
              </div>
              <div>
                <label style={labelStyle}><Mail style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />E-mail</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ ...inputStyle, backgroundColor: !editMode ? (darkMode ? '#0f172a' : '#f1f5f9') : inputStyle.backgroundColor }} disabled={!editMode} />
              </div>
            </div>

            {editMode && (
              <div style={{ borderTop: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`, paddingTop: '20px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '600', color: darkMode ? '#fff' : '#0f172a', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock style={{ width: '14px', height: '14px' }} />Alterar Senha
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Senha Atual</label>
                    <input type={showPassword ? 'text' : 'password'} value={form.current_password} onChange={e => setForm({ ...form, current_password: e.target.value })} style={inputStyle} placeholder="••••••" />
                  </div>
                  <div>
                    <label style={labelStyle}>Nova Senha</label>
                    <input type={showPassword ? 'text' : 'password'} value={form.new_password} onChange={e => setForm({ ...form, new_password: e.target.value })} style={inputStyle} placeholder="••••••" />
                  </div>
                  <div>
                    <label style={labelStyle}>Confirmar</label>
                    <input type={showPassword ? 'text' : 'password'} value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })} style={inputStyle} placeholder="••••••" />
                  </div>
                </div>
                <button onClick={() => setShowPassword(!showPassword)} style={{ marginTop: '8px', padding: 0, border: 'none', backgroundColor: 'transparent', color: '#3b82f6', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {showPassword ? <EyeOff style={{ width: '12px', height: '12px' }} /> : <Eye style={{ width: '12px', height: '12px' }} />}
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div style={{ ...cardStyle, marginTop: '20px' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}` }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: darkMode ? '#fff' : '#0f172a', margin: 0 }}>Estatísticas</h3>
        </div>
        <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[
            { label: 'Uploads', value: lotes.length, color: '#3b82f6' },
            { label: 'Leads Processados', value: lotes.reduce((a, l) => a + (l.validos || 0), 0), color: '#22c55e' },
            { label: 'Envios Bitrix', value: lotes.filter(l => l.status === 'enviado').length, color: '#a855f7' },
            { label: 'Pendentes', value: lotes.filter(l => l.status === 'processado').length, color: '#f59e0b' },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '16px', borderRadius: '8px', backgroundColor: darkMode ? '#0f172a' : '#f8fafc' }}>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: stat.color, margin: 0 }}>{stat.value}</p>
              <p style={{ fontSize: '11px', color: darkMode ? '#64748b' : '#94a3b8', margin: '4px 0 0 0' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={logout} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ef4444', backgroundColor: 'transparent', color: '#ef4444', fontSize: '13px', cursor: 'pointer' }}>
          Sair da Conta
        </button>
      </div>
    </div>
  );
}
