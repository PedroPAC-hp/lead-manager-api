import { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, Trash2, X, Check, Info, HelpCircle } from 'lucide-react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    onConfirm: null,
    onCancel: null,
  });

  const confirm = useCallback(({
    title = 'Confirmar ação',
    message = 'Tem certeza que deseja continuar?',
    type = 'warning',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
  }) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        type,
        confirmText,
        cancelText,
        onConfirm: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        },
      });
    });
  }, []);

  const confirmDelete = useCallback((itemName) => {
    return confirm({
      title: 'Excluir item',
      message: `Tem certeza que deseja excluir "${itemName}"? Esta ação não pode ser desfeita.`,
      type: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
    });
  }, [confirm]);

  return (
    <ConfirmContext.Provider value={{ confirm, confirmDelete }}>
      {children}
      {confirmState.isOpen && <ConfirmModal {...confirmState} />}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }
  return context;
};

function ConfirmModal({ title, message, type, confirmText, cancelText, onConfirm, onCancel }) {
  const config = {
    warning: {
      icon: AlertTriangle,
      iconBg: 'rgba(245, 158, 11, 0.2)',
      iconColor: '#f59e0b',
      confirmBg: '#f59e0b',
      confirmHover: '#d97706',
    },
    danger: {
      icon: Trash2,
      iconBg: 'rgba(239, 68, 68, 0.2)',
      iconColor: '#ef4444',
      confirmBg: '#ef4444',
      confirmHover: '#dc2626',
    },
    info: {
      icon: Info,
      iconBg: 'rgba(59, 130, 246, 0.2)',
      iconColor: '#3b82f6',
      confirmBg: '#3b82f6',
      confirmHover: '#2563eb',
    },
    question: {
      icon: HelpCircle,
      iconBg: 'rgba(168, 85, 247, 0.2)',
      iconColor: '#a855f7',
      confirmBg: '#a855f7',
      confirmHover: '#9333ea',
    },
  };

  const { icon: Icon, iconBg, iconColor, confirmBg } = config[type] || config.warning;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '420px',
        width: '90%',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
        animation: 'scaleIn 0.2s ease-out',
      }}>
        {/* Icon */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <Icon style={{ width: '28px', height: '28px', color: iconColor }} />
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#ffffff',
          textAlign: 'center',
          margin: '0 0 8px 0',
        }}>
          {title}
        </h2>

        {/* Message */}
        <p style={{
          fontSize: '14px',
          color: '#94a3b8',
          textAlign: 'center',
          margin: '0 0 24px 0',
          lineHeight: '1.5',
        }}>
          {message}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: '10px',
              border: '1px solid #334155',
              backgroundColor: 'transparent',
              color: '#94a3b8',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '12px 20px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: confirmBg,
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default ConfirmProvider;
