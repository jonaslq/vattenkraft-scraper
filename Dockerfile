# Dockerfile
FROM node:20

# Skapa appkatalogen
WORKDIR /usr/src/app

# Kopiera package.json och package-lock.json
COPY package*.json ./

# Installera appberoenden
RUN npm install

# Kopiera appens källkod
COPY . .

# Exponera porten
EXPOSE 3080

# Starta appen
CMD [ "node", "index.js" ]
