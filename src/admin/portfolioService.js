/* ── Serviço de portfólio ── */
/* Salva/lê do localStorage; pode ser migrado para API/Firebase futuramente */

const KEY = 'pulsari_portfolio'

const DEFAULT = {
  sites: [
    { id: '1', nome: 'Studio Arquitetura Belém', desc: 'Presença institucional que posicionou o escritório como referência premium no Pará.', tags: ['React','GSAP','Contentful'], context: 'O cliente precisava sair de um site genérico e ocupar um posicionamento de mercado premium.', link: '#' },
    { id: '2', nome: 'Clínica Derma Norte', desc: 'Site que reduziu o tempo de agendamento e aumentou a taxa de conversão em 3x.', tags: ['Next.js','Calendly','SEO'], context: 'A clínica perdia pacientes por dificuldade no agendamento online.', link: '#' },
    { id: '3', nome: 'Construtora Horizonte', desc: 'Plataforma imersiva com mapa interativo e visualização 3D dos empreendimentos.', tags: ['React','Three.js','Mapbox'], context: 'Construtoras competem com grandes portais de imóveis.', link: '#' },
  ],
  landing: [
    { id: '4', nome: 'Lançamento Orion', desc: 'Landing de produto com funil otimizado e taxa de conversão de 8.4%.', tags: ['React','GSAP','RD Station'], context: 'Criado para um lançamento com janela de 7 dias.', link: '#' },
    { id: '5', nome: 'Curso Marketing Digital', desc: 'Copy + design alinhados: 1.200 inscrições na primeira semana.', tags: ['HTML','CSS','JS','Hotmart'], context: 'Trabalhamos junto ao copywriter do cliente.', link: '#' },
    { id: '6', nome: 'Clínica Estética Premium', desc: 'Página de captura com automação de resposta em 5 min.', tags: ['React','EmailJS'], context: 'O maior problema era o tempo de resposta ao lead.', link: '#' },
  ],
  ecommerce: [
    { id: '7', nome: 'Moda Pernambucana', desc: 'E-commerce que faturou R$ 180k no primeiro mês.', tags: ['Next.js','Stripe','PostgreSQL'], context: 'Desenvolvemos um fluxo de compra com o menor número possível de cliques.', link: '#' },
    { id: '8', nome: 'Suplementos Power', desc: 'Plataforma de assinaturas com recorrência automatizada.', tags: ['React','Node.js','MongoDB'], context: 'O modelo de negócio exigia um sistema de assinatura robusto.', link: '#' },
  ],
  sistemas: [
    { id: '9', nome: 'SaaS Gestão Imobiliária', desc: 'Plataforma B2B com 40+ imobiliárias ativas.', tags: ['React','Node.js','PostgreSQL','Docker'], context: 'Sistema completo para gestão de imóveis, contratos e comissões.', link: '#' },
    { id: '10', nome: 'Plataforma EAD', desc: 'LMS com videoaulas em streaming e certificação automática.', tags: ['Next.js','AWS S3','Stripe'], context: 'Criamos do zero uma plataforma de ensino completa.', link: '#' },
    { id: '11', nome: 'App de Logística', desc: 'Rastreamento em tempo real para frota de 200+ veículos.', tags: ['React','Socket.io','Maps API'], context: 'O cliente gerencia uma frota distribuída.', link: '#' },
  ],
}

export const getPortfolio = () => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : DEFAULT
  } catch { return DEFAULT }
}

export const savePortfolio = data => {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export const resetPortfolio = () => {
  localStorage.removeItem(KEY)
  return DEFAULT
}

export const addProject = (cat, project) => {
  const data = getPortfolio()
  const newProject = { ...project, id: Date.now().toString() }
  data[cat] = [...(data[cat] || []), newProject]
  savePortfolio(data)
  return data
}

export const updateProject = (cat, id, updates) => {
  const data = getPortfolio()
  data[cat] = data[cat].map(p => p.id === id ? { ...p, ...updates } : p)
  savePortfolio(data)
  return data
}

export const deleteProject = (cat, id) => {
  const data = getPortfolio()
  data[cat] = data[cat].filter(p => p.id !== id)
  savePortfolio(data)
  return data
}

export const CATS = {
  sites:     { label: 'Sites',       color: '#5A2EA6' },
  landing:   { label: 'Landpages',   color: '#FF2D8D' },
  ecommerce: { label: 'E-commerce',  color: '#2D6BFF' },
  sistemas:  { label: 'Sistemas',    color: '#10b981' },
}
