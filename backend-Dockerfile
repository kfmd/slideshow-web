FROM node:20-alpine

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p /usr/src/app/frontend/public/assets/sample

EXPOSE 8080

CMD ["npm", "start"]
