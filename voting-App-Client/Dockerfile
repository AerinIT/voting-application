# Stage 1: Build the React app
FROM node:16-alpine 
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
EXPOSE 3001
ENV HOST=0.0.0.0
ENV PORT=3001
CMD ["npm", "start"]