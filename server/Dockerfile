# Node image
FROM node:18-alpine

WORKDIR /app

# Copy dependency configs
COPY package*.json ./
COPY prisma ./prisma/

# Install packages
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client structure
RUN npx prisma generate

# Build TypeScript
RUN npm run build

EXPOSE 5000

# Push migrations/schema and start server in production
CMD ["sh", "-c", "npx prisma db push && npm start"]
