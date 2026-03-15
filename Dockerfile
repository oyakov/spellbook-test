# Build stage
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:20-slim
WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm install --production

# Create required directories and set permissions for non-root user
RUN mkdir -p public/library dist/library && \
    chown -R node:node /app

COPY --from=build /app/dist ./dist
COPY server.js ./
RUN touch .env && chown node:node .env

# Use non-root user
USER node

EXPOSE 3000
ENV PORT=3000
CMD ["npm", "start"]
