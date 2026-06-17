# Deploy — borges-nail-styles

Guia completo para subir o sistema em um VPS Ubuntu 22.04 LTS.

> **SQLite não precisa de instalação separada.** O banco de dados é um único arquivo (`database.db`) criado automaticamente na primeira execução. O que precisa ser instalado são as ferramentas de compilação nativas exigidas pelo driver `better-sqlite3` (`build-essential` e `python3`).

---

## 1. Preparar o VPS

Acesse o servidor via SSH:

```bash
ssh usuario@SEU_IP
# Substitua "usuario" pelo seu usuário e "SEU_IP" pelo IP do VPS
```

### Atualizar o sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### Instalar dependências nativas (exigidas pelo better-sqlite3)

```bash
sudo apt install -y build-essential python3
```

### Instalar Node.js 20 via NodeSource

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verificar versões instaladas:

```bash
node -v   # deve exibir v20.x.x
npm -v    # deve exibir 10.x.x ou superior
```

### Instalar PM2 globalmente

PM2 é o gerenciador de processos que mantém o app rodando após reinicializações do servidor.

```bash
sudo npm install -g pm2
```

### Instalar Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## 2. Configurar o projeto

### Opção A — Clonar via Git

```bash
cd /var/www
sudo git clone https://github.com/SEU_USUARIO/borges-nail-styles.git
# Substitua "SEU_USUARIO" pelo seu usuário do GitHub

sudo chown -R $USER:$USER /var/www/borges-nail-styles
cd /var/www/borges-nail-styles
```

### Opção B — Copiar arquivos via rsync (sem Git)

Execute no seu **computador local**:

```bash
rsync -avz \
  --exclude node_modules \
  --exclude .next \
  --exclude database.db \
  ./borges-nail-styles/ usuario@SEU_IP:/var/www/borges-nail-styles/
# Substitua "usuario" e "SEU_IP"
```

### Instalar dependências e gerar o build

```bash
cd /var/www/borges-nail-styles
npm install
npm run build
```

> O `npm install` recompila o módulo nativo `better-sqlite3` para a arquitetura do servidor. É normal levar alguns minutos na primeira vez.

### Garantir permissão de escrita no banco de dados

O arquivo `database.db` é criado automaticamente na primeira execução do app. Garanta que o diretório pertence ao usuário que vai rodar o processo:

```bash
sudo chown -R $USER:$USER /var/www/borges-nail-styles
```

Se estiver **migrando** um banco existente de outro servidor, copie-o antes de iniciar:

```bash
# Executar no computador local para enviar o banco para o servidor:
scp ./database.db usuario@SEU_IP:/var/www/borges-nail-styles/database.db
```

---

## 3. Rodar com PM2

### Iniciar o app

```bash
cd /var/www/borges-nail-styles
pm2 start npm --name borges -- start
```

### Verificar se está rodando

```bash
pm2 status
pm2 logs borges --lines 50
```

### Salvar configuração e ativar auto-start

Estes dois comandos fazem o app reiniciar automaticamente após reboot do servidor:

```bash
pm2 save
pm2 startup
```

O comando `pm2 startup` imprime uma linha para executar com `sudo`. Copie e execute essa linha. Exemplo do que aparecerá:

```
[PM2] To setup the Startup Script, copy/paste the following command:
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u usuario --hp /home/usuario
```

### Comandos úteis do PM2

```bash
pm2 restart borges    # reiniciar o app (ex: após atualização)
pm2 stop borges       # parar o app
pm2 delete borges     # remover da lista do PM2
pm2 logs borges       # ver logs em tempo real
pm2 monit             # painel de monitoramento no terminal
```

---

## 4. Configurar Nginx como reverse proxy

O Nginx recebe as requisições na porta 80 (HTTP padrão) e repassa para o Next.js na porta 3000.

### Criar o arquivo de configuração

```bash
sudo nano /etc/nginx/sites-available/borges
```

Cole o conteúdo abaixo, substituindo `SEU_DOMINIO` pelo seu domínio ou IP:

```nginx
server {
    listen 80;
    server_name SEU_DOMINIO;
    # Exemplos: salao.exemplo.com  ou  192.168.1.100

    # Aumenta o limite de upload para evitar erros em requisições maiores
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # Necessário para WebSockets (Next.js usa em desenvolvimento)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # Encaminha informações reais do cliente para o Next.js
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;
    }
}
```

### Ativar o site e reiniciar o Nginx

```bash
# Criar link simbólico para ativar o site
sudo ln -s /etc/nginx/sites-available/borges /etc/nginx/sites-enabled/

# Testar a configuração antes de aplicar (deve retornar "syntax is ok")
sudo nginx -t

# Reiniciar o Nginx
sudo systemctl restart nginx
```

O sistema já estará acessível em `http://SEU_DOMINIO`.

---

## 5. Backup do banco SQLite

O banco inteiro é um único arquivo. Fazer backup é simplesmente copiar esse arquivo.

### Cópia manual

Execute no seu **computador local** para baixar o banco:

```bash
scp usuario@SEU_IP:/var/www/borges-nail-styles/database.db \
  ./backup-$(date +%Y%m%d).db
```

### Backup automático diário com cron

Crie a pasta de backups e configure o cron no servidor:

```bash
# Criar pasta para armazenar os backups
sudo mkdir -p /backups/borges
sudo chown $USER:$USER /backups/borges

# Abrir o editor de cron do usuário atual
crontab -e
```

Adicione as linhas abaixo ao final do arquivo.
A primeira faz o backup todo dia às 03h00; a segunda remove backups com mais de 30 dias:

```cron
# Backup diário do banco às 03h00
0 3 * * * cp /var/www/borges-nail-styles/database.db /backups/borges/database-$(date +\%Y\%m\%d).db

# Remove backups com mais de 30 dias para não acumular arquivos
5 3 * * * find /backups/borges -name "database-*.db" -mtime +30 -delete
```

Salve e feche. Verificar se o cron foi registrado:

```bash
crontab -l
```

---

## 6. SSL com Certbot (opcional, recomendado)

HTTPS é necessário para acessar o sistema com segurança fora da rede local. **Requer um domínio** apontando para o IP do servidor (não funciona apenas com IP).

### Instalar Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Gerar e instalar o certificado

```bash
sudo certbot --nginx -d SEU_DOMINIO --email SEU_EMAIL --agree-tos --no-eff-email
# Substitua "SEU_DOMINIO" e "SEU_EMAIL"
```

O Certbot modifica automaticamente o arquivo do Nginx para redirecionar HTTP → HTTPS e agenda a renovação automática do certificado a cada 90 dias.

### Testar renovação automática

```bash
sudo certbot renew --dry-run
```

---

## Resumo das portas

| Porta | Serviço        | Descrição                       |
|-------|----------------|---------------------------------|
| 22    | SSH            | Acesso ao servidor              |
| 80    | Nginx (HTTP)   | Entrada pública → proxy → 3000  |
| 443   | Nginx (HTTPS)  | Entrada pública com SSL         |
| 3000  | Next.js / PM2  | App rodando internamente        |

Liberar as portas no firewall do VPS:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## Atualizar o sistema após mudanças no código

```bash
cd /var/www/borges-nail-styles

# Se usar Git:
git pull

# Reinstalar dependências (necessário se package.json mudou)
npm install

# Gerar novo build
npm run build

# Reiniciar o processo — o PM2 aplica sem derrubar o servidor
pm2 restart borges
```
