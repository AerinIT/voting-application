# Stage 1: Build the React app
FROM node:16-alpine 
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build
COPY . .
EXPOSE 3001
CMD ["npm", "start"]