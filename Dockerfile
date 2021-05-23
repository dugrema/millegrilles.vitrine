FROM docker.maceroc.com/millegrilles_webappbase:1.42.1

ENV APP_FOLDER=/usr/src/app \
    NODE_ENV=production \
    PORT=443

EXPOSE 80 443

# Creer repertoire app, copier fichiers
WORKDIR $APP_FOLDER
CMD [ "npm", "start" ]

COPY . $APP_FOLDER/
