#!/bin/bash

NGINX=/usr/sbin/nginx
CONF=/etc/nginx/conf.d
REPLACE_VARS='${WEB_CERT},${WEB_KEY},${WEB_URL},${WEB_COUPDOEIL},${LOCAL_CERT},${LOCAL_KEY},${LOCAL_COUPDOEIL},'

# Faire un lien vers les certificats locaux pour /etc/nginx/conf.d/default.conf
ln -s ${LOCAL_CERT} $APP_BUNDLE_DIR/local.cert.pem
ln -s ${LOCAL_KEY} $APP_BUNDLE_DIR/local.key.pem

# On supporte plusieurs templates de fichiers de configuration
# Faire le remplacement pour chaque template et copier vers /etc/nginx/conf.d

for CONF_NAME in ${NGINX_CONFIG_FILE[@]}; do
  CONFIG_FILE=$APP_BUNDLE_DIR/sites-available/$CONF_NAME
  CONFIG_EFFECTIVE=$APP_BUNDLE_DIR/$CONF_NAME

  echo "Utilisation fichier configuration dans bundle: $CONF_FILE"
  envsubst $REPLACE_VARS < $APP_BUNDLE_DIR/sites-available/$NGINX_CONFIG_FILE > $CONFIG_EFFECTIVE

  echo Creation lien vers $CONF_FILE sous /etc/nginx/conf.d
  ln -s $CONFIG_EFFECTIVE /etc/nginx/conf.d/$CONF_NAME
done

echo "Demarrage de nginx"
nginx -g "daemon off;"
