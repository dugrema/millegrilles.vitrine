FROM node:12

# Create app directory
WORKDIR /usr/src/app

EXPOSE 443

CMD [ "npm", "start" ]

COPY api/package*.json ./
RUN npm install

# Bundle app source
# Api est l'application node back-end et front-end est l'application react
COPY api/ ./
COPY react_build/build/ ./public/
