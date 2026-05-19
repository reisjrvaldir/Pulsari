/* ── Serviço de portfólio ── */
/* Salva/lê do localStorage; pode ser migrado para API/Firebase futuramente */

const KEY = 'pulsari_portfolio'

const DEFAULT = {
  sites: [
    { id: '1', nome: 'Studio Arquitetura Belém', desc: 'Presença institucional que posicionou o escritório como referência premium no Pará.', tags: ['React','GSAP','Contentful'], context: 'O cliente precisava sair de um site genérico e ocupar um posicionamento de mercado premium. Desenvolvemos uma identidade visual forte, carregamento ultra-rápido e integração com CMS para gestão autônoma do portfólio de projetos.', link: '#' },
    { id: '2', nome: 'Clínica Derma Norte', desc: 'Site que reduziu o tempo de agendamento e aumentou a taxa de conversão em 3x.', tags: ['Next.js','Calendly','SEO'], context: 'A clínica perdia pacientes por dificuldade no agendamento online. Integramos um sistema de booking em tempo real, otimizamos o SEO local e criamos páginas de serviço que guiam o paciente até a marcação de consulta.', link: '#' },
    { id: '3', nome: 'Construtora Horizonte', desc: 'Plataforma imersiva com mapa interativo e visualização 3D dos empreendimentos.', tags: ['React','Three.js','Mapbox'], context: 'Construtoras competem com grandes portais de imóveis. Criamos um diferencial competitivo com tour virtual 3D dos empreendimentos e mapa interativo com filtros avançados — diretamente no site próprio da empresa.', link: '#' },
  ],
  landing: [
    { id: '4', nome: 'Lançamento Orion', desc: 'Landing de produto com funil otimizado e taxa de conversão de 8.4%.', tags: ['React','GSAP','RD Station'], context: 'Criado para um lançamento com janela de 7 dias, o projeto exigiu velocidade de desenvolvimento sem abrir mão da performance. Integração completa com RD Station para nutrição automática dos leads captados.', link: '#' },
    { id: '5', nome: 'Curso Marketing Digital', desc: 'Copy + design alinhados: 1.200 inscrições na primeira semana de tráfego pago.', tags: ['HTML','CSS','JS','Hotmart'], context: 'Trabalhamos junto ao copywriter do cliente para garantir que design e texto se potencializassem mutuamente. Integração com Hotmart e pixel de conversão configurado para rastrear cada etapa do funil.', link: '#' },
    { id: '6', nome: 'Clínica Estética Premium', desc: 'Página de captura com formulário inteligente e automação de resposta em 5 min.', tags: ['React','EmailJS'], context: 'O maior problema era o tempo de resposta ao lead. Implementamos automação que envia uma mensagem personalizada em menos de 5 minutos após o preenchimento do formulário, reduzindo drasticamente a desistência.', link: '#' },
    { id: '12', nome: 'ALPHA LED', desc: 'Construção de site institucional para empresa do setor de iluminação LED.', tags: ['WordPress','HTML','CSS','SQL'], context: 'Site institucional completo para a Alpha LED, com catálogo de produtos, páginas de serviço e integração com formulário de orçamento.', imagem: 'https://lh3.googleusercontent.com/d/1mcXV3BBDJKm3_UYZQTi4v6te0jB', link: '#' },
  ],
  ecommerce: [
    { id: '7', nome: 'Moda Pernambucana', desc: 'E-commerce que faturou R$ 180k no primeiro mês com foco em UX e checkout rápido.', tags: ['Next.js','Stripe','PostgreSQL'], context: 'Desenvolvemos um fluxo de compra com o menor número possível de cliques do carrinho ao pagamento. Checkout otimizado, relatórios em tempo real e painel administrativo completo para gestão do estoque.', link: '#' },
    { id: '8', nome: 'Suplementos Power', desc: 'Plataforma de assinaturas com recorrência automatizada e área do cliente.', tags: ['React','Node.js','MongoDB'], context: 'O modelo de negócio exigia um sistema de assinatura robusto. Implementamos cobranças recorrentes, área do assinante com histórico de pedidos, e sistema de indicação com cupons dinâmicos.', link: '#' },
  ],
  sistemas: [
    { id: '9', nome: 'SaaS Gestão Imobiliária', desc: 'Plataforma B2B com 40+ imobiliárias ativas, contratos digitais e BI integrado.', tags: ['React','Node.js','PostgreSQL','Docker'], context: 'Sistema completo para gestão de imóveis, contratos e comissões. Desenvolvemos módulos de assinatura digital, relatórios de desempenho por corretor e dashboard executivo com métricas em tempo real.', link: '#' },
    { id: '10', nome: 'Plataforma EAD', desc: 'LMS com videoaulas em streaming, certificação automática e integração Stripe.', tags: ['Next.js','AWS S3','Stripe'], context: 'Criamos do zero uma plataforma de ensino completa: upload de vídeo com transcodificação automática, progresso de aluno por módulo, emissão de certificado em PDF e gestão financeira integrada.', link: '#' },
    { id: '11', nome: 'App de Logística', desc: 'Rastreamento em tempo real com Socket.io para frota de 200+ veículos.', tags: ['React','Socket.io','Maps API'], context: 'O cliente gerencia uma frota distribuída e precisava de visibilidade em tempo real. Desenvolvemos um painel com atualização por WebSocket, histórico de rotas, alertas automáticos e API para integração com ERPs.', link: '#' },
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
