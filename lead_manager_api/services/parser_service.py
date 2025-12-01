"""
Serviço para parsing de arquivos XLS/HTML do Portal NEAD.
"""

from bs4 import BeautifulSoup
from typing import List, Dict, Any, Optional
import re


def limpar_texto(texto: Any) -> str:
    """Remove espaços extras e caracteres especiais."""
    if texto is None:
        return ""
    texto = str(texto).strip()
    # Remove &nbsp; e espaços múltiplos
    texto = re.sub(r'\s+', ' ', texto)
    texto = texto.replace('\xa0', ' ').strip()
    return texto


def limpar_telefone(telefone: str) -> str:
    """Limpa e formata telefone."""
    if not telefone:
        return ""
    # Remove tudo que não é número
    numeros = re.sub(r'[^\d]', '', telefone)
    return numeros


def parse_html_xls(conteudo: bytes, encoding: str = 'utf-8') -> List[Dict[str, Any]]:
    """
    Faz o parsing de um arquivo XLS que na verdade é HTML.
    
    Args:
        conteudo: Bytes do arquivo
        encoding: Encoding do arquivo
        
    Returns:
        Lista de dicionários com os dados de cada linha
    """
    try:
        html = conteudo.decode(encoding)
    except UnicodeDecodeError:
        html = conteudo.decode('latin-1')
    
    soup = BeautifulSoup(html, 'html.parser')
    
    # Encontra a tabela
    tabela = soup.find('table')
    if not tabela:
        raise ValueError("Nenhuma tabela encontrada no arquivo")
    
    linhas = tabela.find_all('tr')
    if len(linhas) < 2:
        raise ValueError("Arquivo não contém dados suficientes")
    
    # Primeira linha são os headers
    headers_row = linhas[0]
    headers = []
    for cell in headers_row.find_all(['td', 'th']):
        header_text = limpar_texto(cell.get_text())
        headers.append(header_text)
    
    # Processa as linhas de dados
    dados = []
    for linha in linhas[1:]:
        celulas = linha.find_all('td')
        if len(celulas) == 0:
            continue
            
        registro = {}
        valores = []
        
        for i, celula in enumerate(celulas):
            valor = limpar_texto(celula.get_text())
            valores.append(valor)
            
            if i < len(headers):
                registro[headers[i]] = valor
        
        # Também guarda como lista para acesso por índice
        registro['_valores'] = valores
        registro['_num_colunas'] = len(valores)
        
        # Só adiciona se tiver dados relevantes
        if any(v for v in valores[:5] if v):  # Pelo menos uma das 5 primeiras colunas preenchida
            dados.append(registro)
    
    return dados


def extrair_lead_do_registro(
    registro: Dict[str, Any],
    mapeamento: Dict[str, int]
) -> Dict[str, Any]:
    """
    Extrai os campos do lead baseado no mapeamento de colunas.
    
    Args:
        registro: Dicionário com dados da linha
        mapeamento: Dicionário com índices das colunas
        
    Returns:
        Dicionário com os campos do lead
    """
    valores = registro.get('_valores', [])
    
    def get_valor(indice: int) -> str:
        if indice < len(valores):
            return valores[indice]
        return ""
    
    lead = {
        'candidato_id': get_valor(mapeamento.get('candidato', 0)),
        'nome': get_valor(mapeamento.get('nome', 3)),
        'curso_codigo': get_valor(mapeamento.get('curso_codigo', 4)),
        'polo': get_valor(mapeamento.get('polo', 5)),
        'status_mensalidade': get_valor(mapeamento.get('mensalidade', 12)),
        'celular': limpar_telefone(get_valor(mapeamento.get('celular', 14))),
        'cpf': get_valor(mapeamento.get('cpf', 21)),
        'inscrito_por': get_valor(mapeamento.get('inscrito_por', 31)),
        'curso_nome': get_valor(mapeamento.get('nome_curso', 36)),
    }
    
    # Guarda todos os dados originais
    lead['dados_extras'] = {k: v for k, v in registro.items() if not k.startswith('_')}
    
    return lead


def aplicar_filtros(
    leads: List[Dict[str, Any]],
    filtro_inscrito_por: Dict[str, Any],
    filtro_status: Dict[str, Any]
) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Aplica os filtros configurados nos leads.
    
    Returns:
        Tupla com (leads_validos, leads_filtrados)
    """
    validos = []
    filtrados = []
    
    valores_permitidos = filtro_inscrito_por.get('valores_permitidos', ['6111 DIGITAL'])
    modo = filtro_inscrito_por.get('modo', 'whitelist')
    status_remover = filtro_status.get('remover', ['PAGO'])
    
    for lead in leads:
        motivo = None
        
        # Filtro de status (mensalidade)
        status = lead.get('status_mensalidade', '').upper()
        if any(s.upper() in status for s in status_remover):
            motivo = f"Status removido: {status}"
        
        # Filtro de "Inscrito Por"
        if not motivo:
            inscrito_por = lead.get('inscrito_por', '')
            
            if modo == 'whitelist':
                # Só permite se estiver na lista
                if not any(v.upper() in inscrito_por.upper() for v in valores_permitidos):
                    motivo = f"Inscrito por não permitido: {inscrito_por}"
            else:  # blacklist
                # Remove se estiver na lista
                if any(v.upper() in inscrito_por.upper() for v in valores_permitidos):
                    motivo = f"Inscrito por bloqueado: {inscrito_por}"
        
        if motivo:
            lead['motivo_filtro'] = motivo
            filtrados.append(lead)
        else:
            validos.append(lead)
    
    return validos, filtrados