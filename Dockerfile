# State 1: Build
FROM node:22-alpine AS builder
RUN mkdir /app
WORKDIR /app
COPY . .
RUN npm install
RUN npm run setup:client
RUN npm run build:client 
RUN npm run copy-client 
RUN npm run build:server 


# Stage 2: Production
FROM node:22-alpine AS production

WORKDIR /app
COPY --from=builder /app/package*.json /app/
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/public /app/public
RUN npm ci --only=production
ENV NODE_ENV=production

EXPOSE 3000
CMD [ "npm", "run", "start:server" ]