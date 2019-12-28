#!/bin/bash

NGINX=/usr/sbin/nginx
CONF=/etc/nginx/conf.d
REPLACE_VARS='${WEB_CERT},${WEB_KEY},${WEB_URL},${WEB_COUPDOEIL},${LOCAL_CERT},${LOCAL_KEY},${LOCAL_COUPDOEIL},'

if [ -z $NGINX_CONFIG_FILE ]; then
  NGINX_CONFIG_FILE=default.conf
fi

CONFIG_FILE=$APP_BUNDLE_DIR/sites-available/$NGINX_CONFIG_FILE
CONFIG_EFFECTIVE=$APP_BUNDLE_DIR/nginx-site.conf

if [ ! -f $CONFIG_EFFECTIVE ]; then
  export COUPDOEIL_IP=`getent hosts coupdoeilreact | awk '{print $1}'`
  echo "Adresse IP interne de coupdoeilreact: $COUPDOEILIP"

  echo "Utilisation fichier configuration dans bundle: $NGINX_CONFIG_FILE"
  envsubst $REPLACE_VARS < $APP_BUNDLE_DIR/sites-available/$NGINX_CONFIG_FILE > $CONFIG_EFFECTIVE
else
  echo "[WARN] Fichier de configuration existe deja: $CONFIG_EFFECTIVE"
  echo "On assume que le fichier est controle de maniere externe, aucune modification faite"
fi

echo Creation lien vers $NGINX_CONFIG_FILE sous /etc/nginx/conf.d
ln -s $CONFIG_EFFECTIVE /etc/nginx/conf.d/$NGINX_CONFIG_FILE

echo "Demarrage de nginx avec configuration $NGINX_CONFIG_FILE"
nginx -g "daemon off;"
