#!/usr/bin/env bash

CERT_FOLDER=/home/mathieu/mgdev/certs
# export MG_IDMG=vPXTaPjpUErFjV5d8pKrAHHqKhFUr7GSEruCL7
# export MG_CONSIGNATION_PATH=/var/opt/millegrilles/$IDMG/mounts/consignation
export HOST=`hostname`

# CERT_FOLDER=/opt/millegrilles/$MG_NOM_MILLEGRILLE/pki/deployeur
CERT_FOLDER=/home/mathieu/mgdev/certs

# export COUPDOEIL_SESSION_TIMEOUT=15000
export MG_MQ_CAFILE=$CERT_FOLDER/pki.millegrille.cert
export MG_MQ_CERTFILE=$CERT_FOLDER/pki.vitrineweb.cert
export MG_MQ_KEYFILE=$CERT_FOLDER/pki.vitrineweb.key

export DATA_FOLDER=/var/opt/millegrilles/2DE28fU9miADsNV9MdgV26NZ76CLZMrcM9hrCoD/nginx/data

export MG_MQ_URL=amqps://$HOST:5673
export PORT=3007

export SERVER_TYPE=spdy

export NODE_ENV=development

# Parametre module logging debug
export DEBUG=millegrilles:*

npm start
