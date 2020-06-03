#!/bin/bash

NGINX=/usr/sbin/nginx
CONF=/etc/nginx/conf.d
PARAMS_FILE=/tmp/params.txt
PUBLIC_CONF_TEMPLATE=$APP_BUNDLE_DIR
REPLACE_VARS='${IDMG},${WEB_URL},${IDMGLOWER},${UPLINKURL}'

# Configuration standard qui utilise un hostname pour upstream
CONF_NAME_UPLINKURL=public.conf
# Configuration via DNS SRV record plutot qu'un hostname pour upstream
CONF_NAME_SRV=awssrv.conf

# On supporte plusieurs de fichiers de configuration (un par millegrille)
# Faire le remplacement pour chaque template et copier vers /etc/nginx/conf.d

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

  export IDMG
  export WEB_URL

  echo "IDMG=$IDMG"
  echo "WEB_URL=$WEB_URL"
  echo "WEB_CERT=$WEB_CERT"
  echo "WEB_KEY=$WEB_KEY"

  # Identifier le type de configuration a utiliser (template)
  if [ -n "$SRV" ]; then
    export SRV
    export HOST
    echo "Uplink SRV=$SRV, HOST=$HOST"
    CONF_NAME=$CONF_NAME_SRV
  elif [ -n "$UPLINKURL" ]; then
    export UPLINKURL
    echo "Uplink URL $UPLINKURL"
    CONF_NAME=$CONF_NAME_UPLINKURL
  else
    echo "Configuration non reconnue, IDMG=${IDMG} ne sera pas disponible."
    continue
  fi

  # Faire le lien avec le cert/cle X509 public (e.g. letsencrypt)
  ln -s $WEB_CERT $APP_BUNDLE_DIR/$IDMG.cert.pem
  ln -s $WEB_KEY $APP_BUNDLE_DIR/$IDMG.key.pem

  # Generer le fichier de configuration pour la MilleGrille
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
