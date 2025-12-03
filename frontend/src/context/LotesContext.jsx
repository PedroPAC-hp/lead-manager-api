import { createContext, useContext, useState, useEffect } from 'react';

const LotesContext = createContext(null);

export function LotesProvider({ children }) {
  const [lotes, setLotes] = useState([]);
  const [loteAtual, setLoteAtual] = useState(null);

  // Carregar do localStorage na inicialização
  useEffect(() => {
    const saved = localStorage.getItem('leadmanager_lotes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLotes(parsed);
        // Definir o lote mais recente como atual
        if (parsed.length > 0) {
          setLoteAtual(parsed[0]);
        }
      } catch (e) {
        console.error('Erro ao carregar lotes:', e);
      }
    }
  }, []);

  // Salvar no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('leadmanager_lotes', JSON.stringify(lotes));
  }, [lotes]);

  const adicionarLote = (lote) => {
    const novoLote = {
      ...lote,
      id: lote.lote_id || lote.id,
      criadoEm: new Date().toISOString(),
      status: lote.status || 'upload',
    };
    
    setLotes(prev => {
      // Remover duplicatas
      const filtered = prev.filter(l => l.id !== novoLote.id);
      // Adicionar no início e manter apenas os últimos 20
      return [novoLote, ...filtered].slice(0, 20);
    });
    
    setLoteAtual(novoLote);
    return novoLote;
  };

  const atualizarLote = (loteId, dados) => {
    setLotes(prev => prev.map(l => 
      l.id === loteId ? { ...l, ...dados, atualizadoEm: new Date().toISOString() } : l
    ));
    
    if (loteAtual?.id === loteId) {
      setLoteAtual(prev => ({ ...prev, ...dados }));
    }
  };

  const removerLote = (loteId) => {
    setLotes(prev => prev.filter(l => l.id !== loteId));
    if (loteAtual?.id === loteId) {
      setLoteAtual(null);
    }
  };

  const selecionarLote = (loteId) => {
    const lote = lotes.find(l => l.id === loteId);
    setLoteAtual(lote || null);
    return lote;
  };

  const limparLotes = () => {
    setLotes([]);
    setLoteAtual(null);
    localStorage.removeItem('leadmanager_lotes');
  };

  const getLotesPorStatus = (status) => {
    if (!status || status === 'todos') return lotes;
    return lotes.filter(l => l.status === status);
  };

  const getLotesPorProduto = (produtoId) => {
    return lotes.filter(l => l.produto_id === produtoId);
  };

  return (
    <LotesContext.Provider value={{
      lotes,
      loteAtual,
      adicionarLote,
      atualizarLote,
      removerLote,
      selecionarLote,
      limparLotes,
      getLotesPorStatus,
      getLotesPorProduto,
      setLoteAtual,
    }}>
      {children}
    </LotesContext.Provider>
  );
}

export const useLotes = () => {
  const context = useContext(LotesContext);
  if (!context) {
    throw new Error('useLotes must be used within LotesProvider');
  }
  return context;
};

export default LotesProvider;
