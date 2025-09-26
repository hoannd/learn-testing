FROM node:24-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY server/ ./server/
COPY tsconfig.json ./

# Install tsx for running TypeScript
RUN npm install -g tsx

# Expose port
EXPOSE 3000

# Start the server
CMD ["tsx", "server/main.ts"]
