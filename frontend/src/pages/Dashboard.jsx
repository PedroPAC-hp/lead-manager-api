import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { consultoresService, produtosService } from '../services/api';
import { Users, Package, Upload, Send, TrendingUp, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    consultores: 0,
    produtos: 0,
    leadsHoje: '-',
    leadsEnviados: '-',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [consultores, produtos] = await Promise.all([
        consultoresService.list(),
        produtosService.list(),
      ]);
      setStats({
        consultores: consultores.length,
        produtos: produtos.length,
        leadsHoje: '-',
        leadsEnviados: '-',
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const cardStyle = {
    backgroundColor: darkMode ? '#1e293b' : '#ffffff',
    border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
    borderRadius: '12px',
    padding: '20px',
  };

  const statCards = [
    { icon: Users, label: 'Consultores', value: stats.consultores, color: '#3b82f6' },
    { icon: Package, label: 'Produtos', value: stats.produtos, color: '#22c55e' },
    { icon: Upload, label: 'Leads Hoje', value: stats.leadsHoje, color: '#a855f7' },
    { icon: Send, label: 'Enviados', value: stats.leadsEnviados, color: '#f97316' },
  ];

  const quickActions = [
    { icon: Upload, label: 'Upload de Leads', desc: 'Carregar nova base', path: '/upload', color: '#3b82f6' },
    { icon: Users, label: 'Consultores', desc: 'Adicionar ou editar', path: '/consultores', color: '#22c55e' },
    { icon: Package, label: 'Produtos', desc: 'Configurar produtos', path: '/produtos', color: '#a855f7' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: darkMode ? '#ffffff' : '#0f172a',
          margin: 0 
        }}>
          {getGreeting()}, {user?.full_name?.split(' ')[0]}! 👋
        </h1>
        <p style={{ 
          color: darkMode ? '#94a3b8' : '#64748b', 
          marginTop: '4px',
          fontSize: '14px' 
        }}>
          Aqui está o resumo do seu sistema de leads
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '16px',
        marginBottom: '24px'
      }}>
        {statCards.map((card, index) => (
          <div key={index} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  color: darkMode ? '#94a3b8' : '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  margin: 0
                }}>
                  {card.label}
                </p>
                {loading ? (
                  <Loader2 style={{ width: '24px', height: '24px', color: card.color, marginTop: '8px' }} className="animate-spin" />
                ) : (
                  <p style={{ 
                    fontSize: '28px', 
                    fontWeight: 'bold', 
                    color: darkMode ? '#ffffff' : '#0f172a',
                    margin: '8px 0 0 0'
                  }}>
                    {card.value}
                  </p>
                )}
              </div>
              <div style={{ 
                padding: '10px', 
                borderRadius: '10px', 
                background: `linear-gradient(135deg, ${card.color}, ${card.color}dd)` 
              }}>
                <card.icon style={{ width: '20px', height: '20px', color: '#ffffff' }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ ...cardStyle, marginBottom: '24px' }}>
        <h2 style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          color: darkMode ? '#ffffff' : '#0f172a',
          margin: '0 0 16px 0'
        }}>
          Ações Rápidas
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => navigate(action.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                borderRadius: '10px',
                border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                backgroundColor: darkMode ? '#0f172a' : '#f8fafc',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = action.color;
                e.currentTarget.style.backgroundColor = darkMode ? '#1e293b' : '#ffffff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = darkMode ? '#334155' : '#e2e8f0';
                e.currentTarget.style.backgroundColor = darkMode ? '#0f172a' : '#f8fafc';
              }}
            >
              <div style={{ 
                padding: '10px', 
                borderRadius: '8px', 
                background: `linear-gradient(135deg, ${action.color}, ${action.color}dd)` 
              }}>
                <action.icon style={{ width: '20px', height: '20px', color: '#ffffff' }} />
              </div>
              <div>
                <p style={{ 
                  fontWeight: '600', 
                  fontSize: '14px',
                  color: darkMode ? '#ffffff' : '#0f172a',
                  margin: 0
                }}>
                  {action.label}
                </p>
                <p style={{ 
                  fontSize: '12px', 
                  color: darkMode ? '#94a3b8' : '#64748b',
                  margin: '2px 0 0 0'
                }}>
                  {action.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Info Card */}
      <div style={{
        padding: '20px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <div style={{ 
          padding: '12px', 
          borderRadius: '10px', 
          backgroundColor: 'rgba(255,255,255,0.2)' 
        }}>
          <TrendingUp style={{ width: '28px', height: '28px', color: '#ffffff' }} />
        </div>
        <div>
          <h3 style={{ 
            fontWeight: '600', 
            fontSize: '16px',
            color: '#ffffff',
            margin: 0
          }}>
            Sistema Pronto!
          </h3>
          <p style={{ 
            fontSize: '14px', 
            color: '#bfdbfe',
            margin: '4px 0 0 0'
          }}>
            API funcionando e conectada ao Bitrix24. Comece fazendo upload de leads.
          </p>
        </div>
      </div>
    </div>
  );
}