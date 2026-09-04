// Dados reais de contato e navegação da Pulsari.
// ⚠️ Domínio e e-mail ainda ficam vazios até serem preenchidos — nenhum contato
// foi inventado. WhatsApp e Instagram já são os dados reais informados pela agência.

export const site = {
  name: 'Pulsari',
  tagline: 'Estratégia, Design e Tecnologia',
  domain: '', // ex: 'pulsari.com.br' — usado no canonical e OG, preencher quando disponível
  location: 'Recife, PE · Brasil',

  nav: [
    { label: 'Início', href: '#inicio' },
    { label: 'Sobre', href: '#sobre' },
    { label: 'Serviços', href: '#servicos' },
    { label: 'Portfólio', href: '#portfolio' },
    { label: 'Processo', href: '#processo' },
    { label: 'Contato', href: '#contato' },
  ],

  contact: {
    whatsappNumber: '558189654487',
    whatsappDisplay: '+55 81 8965-4487',
    whatsappMessage: 'Olá! Encontrei a Pulsari e quero conversar sobre um projeto.',
    email: 'ag.pulsari@gmail.com',
    instagram: 'https://instagram.com/agenciapulsari',
    instagramHandle: '@agenciapulsari',
    linkedin: '',
  },
} as const

export function whatsappHref(message?: string) {
  const { whatsappNumber, whatsappMessage } = site.contact
  if (!whatsappNumber) return '#contato'
  const text = encodeURIComponent(message ?? whatsappMessage)
  return `https://wa.me/${whatsappNumber}?text=${text}`
}

export function mailHref() {
  const { email } = site.contact
  return email ? `mailto:${email}` : '#contato'
}
