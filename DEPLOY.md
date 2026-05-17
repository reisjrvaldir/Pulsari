# 🚀 Deploy — Pulsari Landpage (Hostinger VPS)

## Pré-requisitos no servidor
```bash
node -v      # >= 18
npm -v       # >= 9
pm2 -v       # npm install -g pm2
nginx -v
```

---

## 1. Configurar App Password do Gmail

Para receber notificações por e-mail:

1. Acesse: https://myaccount.google.com/security
2. Ative **Verificação em duas etapas**
3. Vá em **Senhas de app** → crie uma para "Pulsari Site"
4. Copie os 16 dígitos gerados → use em `EMAIL_PASS` no `.env`

---

## 2. Configurar variáveis de ambiente no servidor

```bash
# Na VPS, dentro de /var/www/pulsari/
cp .env.production .env
nano .env
```

Preencha:
- `ALLOWED_ORIGIN` — seu domínio (ex: https://agenciapulsari.com.br)
- `ADMIN_TOKEN` — gere uma string aleatória longa: `openssl rand -hex 32`
- `EMAIL_PASS` — App Password de 16 dígitos do Gmail
- `SITE_URL` — URL completa do site
- `VITE_ADMIN_TOKEN` — mesmo valor do `ADMIN_TOKEN`
- `VITE_API_URL` — https://seudominio.com.br/api

---

## 3. Build do frontend

```bash
# Localmente, antes de enviar para o servidor:
npm run build

# Isso gera a pasta dist/
```

---

## 4. Upload para o servidor

```bash
# Pelo terminal local (substitua usuário e IP):
rsync -avz --exclude=node_modules --exclude=.git \
  ./ root@SEU_IP_VPS:/var/www/pulsari/

# OU via SFTP do painel Hostinger
```

---

## 5. Instalar dependências no servidor

```bash
cd /var/www/pulsari
npm install --production
```

---

## 6. Configurar nginx

```bash
# Copiar configuração
sudo cp nginx.conf /etc/nginx/sites-available/pulsari
sudo ln -s /etc/nginx/sites-available/pulsari /etc/nginx/sites-enabled/

# Substituir seudominio.com.br pelo domínio real em:
sudo nano /etc/nginx/sites-available/pulsari

# Testar e recarregar
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. SSL com Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seudominio.com.br -d www.seudominio.com.br
```

---

## 8. Iniciar com PM2

```bash
cd /var/www/pulsari
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup   # garante restart automático após reboot
```

---

## 9. Verificar

```bash
pm2 status           # deve mostrar "online"
pm2 logs pulsari     # logs em tempo real
curl http://localhost:3001/api/messages/unread-count  # deve retornar {"count":0}
```

---

## Atualizar o site (após mudanças)

```bash
# Localmente:
npm run build
rsync -avz dist/ root@SEU_IP_VPS:/var/www/pulsari/dist/

# No servidor (se mudou algo no server/):
cd /var/www/pulsari
pm2 restart pulsari
```

---

## Estrutura de pastas no servidor

```
/var/www/pulsari/
├── dist/              ← build do React (frontend)
├── server/
│   ├── index.js       ← API Node.js
│   └── data/
│       └── messages.json  ← mensagens dos formulários
├── .env               ← variáveis de ambiente (NÃO subir para git)
├── ecosystem.config.js
└── package.json
```

---

## Acesso ao painel admin

```
https://seudominio.com.br/admin/login

Email: pulsaris.digital@gmail.com
Senha: (definida no .env — VITE_ADMIN_PASS)
```
