# Pulsari — Landing Page

Landing page premium da Agência Pulsari. React + TypeScript + Vite + Tailwind CSS + Framer Motion.

## Como rodar

```bash
npm install
npm run dev       # ambiente de desenvolvimento (http://localhost:5173)
npm run build     # build de produção (gera a pasta dist/)
npm run preview   # serve o build de produção localmente
npm run lint       # oxlint
```

Requer Node.js 18+.

## Pendências reais (nada foi inventado)

Nenhum arquivo de projeto anterior da Pulsari foi encontrado neste ambiente — este
é um projeto novo, construído do zero a partir do vídeo e das imagens de
referência enviados. Por isso, alguns pontos ficaram deliberadamente como
placeholder, marcados no código, e precisam ser substituídos com o material
real da agência antes de publicar:

- **`src/config/site.ts`** — WhatsApp, e-mail, Instagram, LinkedIn e domínio
  estão vazios. Preencha os valores reais; os botões de CTA e o rodapé já
  usam esse arquivo como fonte única.
- **`src/components/Logo.tsx`** — nenhum arquivo de logotipo foi encontrado,
  então a marca aparece como wordmark tipográfico ("pulsari."). Assim que o
  logo oficial existir, troque por `<img src="/images/logo.svg" />`.
- **`src/components/About.tsx`** — nenhuma foto real dos fundadores (Shirley
  Gomes e Valdir Reis) foi encontrada; os avatares são iniciais tipográficas.
  Substitua por `<img>` com as fotos reais.
- **`src/components/Portfolio.tsx`** — os três projetos citados (Cardassi &
  Saad, Hospital Veterinário Dr. Drummond, Atenxo) estão com estrutura
  completa (número, nome, categoria, frame, texto), mas sem imagens,
  contexto, solução ou link reais, pois nenhum material desses cases foi
  encontrado. Nada foi inventado — o texto está explicitamente marcado como
  "case em atualização".
- **`src/components/Trust.tsx`** — como não há depoimentos, logos de
  clientes autorizados ou métricas comprovadas disponíveis, a seção usa
  princípios de confiança em vez de números fabricados.

## Vídeo da hero

- Original preservado em `public/video/original/hero-ribbon-original.mp4`
  (não foi alterado nem removido).
- Versões otimizadas para web em `public/video/`: `hero-ribbon.webm` (VP9,
  ~1.2 MB) e `hero-ribbon.mp4` (H.264, ~0.9 MB), ambas sem áudio e com
  `hero-poster.jpg` como poster/fallback.
- `Hero.tsx` usa `autoplay`, `muted`, `loop`, `playsInline`, pausa o vídeo via
  `IntersectionObserver` quando sai da viewport, e substitui o vídeo por uma
  imagem estática quando `prefers-reduced-motion: reduce` está ativo.

## Estrutura

```
src/
  components/   # um componente por seção da landing page
  config/       # dados de navegação e contato (site.ts)
  lib/          # hooks compartilhados (reveal on scroll, reduced motion, header)
public/
  video/        # vídeo original + versões otimizadas + poster
```
