import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authService = {
  login: async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },
  
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Consultores
export const consultoresService = {
  list: async (apenasAtivos = false) => {
    const response = await api.get(`/consultores/?apenas_ativos=${apenasAtivos}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/consultores/', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/consultores/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/consultores/${id}`);
    return response.data;
  },
};

// Produtos
export const produtosService = {
  list: async (apenasAtivos = false) => {
    const response = await api.get(`/produtos/?apenas_ativos=${apenasAtivos}`);
    return response.data;
  },
  
  get: async (id) => {
    const response = await api.get(`/produtos/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/produtos/', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/produtos/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/produtos/${id}`);
    return response.data;
  },
  
  addConsultor: async (produtoId, consultorId) => {
    const response = await api.post(`/produtos/${produtoId}/consultores/${consultorId}`);
    return response.data;
  },
  
  removeConsultor: async (produtoId, consultorId) => {
    const response = await api.delete(`/produtos/${produtoId}/consultores/${consultorId}`);
    return response.data;
  },
};

// Leads
export const leadsService = {
  upload: async (produtoId, file) => {
    const formData = new FormData();
    formData.append('arquivo', file);
    
    const response = await api.post(`/leads/upload/${produtoId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  
  processar: async (loteId) => {
    const response = await api.post(`/leads/processar/${loteId}`);
    return response.data;
  },
  
  getResumo: async (loteId) => {
    const response = await api.get(`/leads/lote/${loteId}/resumo`);
    return response.data;
  },
  
  getLeads: async (loteId, status = null, skip = 0, limit = 100) => {
    let url = `/leads/lote/${loteId}/leads?skip=${skip}&limit=${limit}`;
    if (status) url += `&status_filtro=${status}`;
    const response = await api.get(url);
    return response.data;
  },
  
  enviar: async (loteId) => {
    const response = await api.post(`/leads/enviar/${loteId}`);
    return response.data;
  },
  
  getHistorico: async (skip = 0, limit = 100) => {
    const response = await api.get(`/leads/historico?skip=${skip}&limit=${limit}`);
    return response.data;
  },
};

export default api;