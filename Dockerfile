# Dockerfile
# Imagem base oficial leve do Node.js
FROM node:20-alpine

# Define diretório de trabalho do container
WORKDIR /usr/src/app

# Copia pacotes e instala apenas dependências de produção no backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install --only=production

# Copia todo o restante do projeto (obedecendo o .dockerignore)
COPY . .

# Expõe a porta de tráfego do servidor
EXPOSE 3000

# Define o diretório de execução padrão do Node
WORKDIR /usr/src/app/backend
CMD ["npm", "start"]
