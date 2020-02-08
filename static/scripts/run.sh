#!/bin/bash

NGINX=/usr/sbin/nginx
CONF=/etc/nginx/conf.d
PARAMS_FILE=/tmp/params.txt
PUBLIC_CONF_TEMPLATE=$APP_BUNDLE_DIR
CONF_NAME=public.conf
REPLACE_VARS='${IDMG},${WEB_URL},${IDMGLOWER}'

# On supporte plusieurs de fichiers de configuration (un par millegrille)
# Faire le remplacement pour chaque template et copier vers /etc/nginx/conf.d

# IDMG_33KRMhqcWCKvMHyY5xymMCUEbT53Kg1NqUb9AU6="IDMG=33KRMhqcWCKvMHyY5xymMCUEbT53Kg1NqUb9AU6 WEB_URL=www.millegrilles.com WEB_CERT=/run/secrets/33KRMhqcWCKvMHyY5xymMCUEbT53Kg1NqUb9AU6.fullchain.pem WEB_KEY=/run/secrets/33KRMhqcWCKvMHyY5xymMCUEbT53Kg1NqUb9AU6.key.pem"

LISTE_MILLEGRILLES=`env | awk -F= '/^IDMG_/ {print $1}'`

for CLE_IDMG in ${LISTE_MILLEGRILLES[@]}; do
  PARAMS=${!CLE_IDMG}
  IDMG=`echo $CLE_IDMG | awk 'BEGIN {FS="_"} {print $2}'`

  # Utiliser un fichier pour charger les parametres dans l'environnement
  echo '' > $PARAMS_FILE
  for PARAM in ${PARAMS[@]}; do
    echo $PARAM >> $PARAMS_FILE
  done
  source $PARAMS_FILE

  export IDMG=$IDMG
  export IDMGLOWER=`echo "$IDMG" | tr '[:upper:]' '[:lower:]'`
  export WEB_URL=$WEB_URL

  echo "IDMG=$IDMG"
  echo "IDMGLOWER=$IDMGLOWER"
  echo "WEB_URL=$WEB_URL"
  echo "WEB_CERT=$WEB_CERT"
  echo "WEB_KEY=$WEB_KEY"

  ln -s $WEB_CERT $APP_BUNDLE_DIR/$IDMG.cert.pem
  ln -s $WEB_KEY $APP_BUNDLE_DIR/$IDMG.key.pem

  CONFIG_FILE=$APP_BUNDLE_DIR/$CONF_NAME
  CONFIG_EFFECTIVE=$APP_BUNDLE_DIR/$IDMG.conf

  envsubst $REPLACE_VARS < $CONFIG_FILE > $CONFIG_EFFECTIVE
  echo Creation lien vers $IDMG.conf sous /etc/nginx/conf.d
  ln -s $CONFIG_EFFECTIVE /etc/nginx/conf.d/$IDMG.conf

  cat $CONFIG_EFFECTIVE
  echo "Config $IDMG prete"
done

echo "Demarrage de nginx"
nginx -g "daemon off;"
