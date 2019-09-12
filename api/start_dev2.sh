#!/usr/bin/env bash

CERT_FOLDER=/opt/millegrilles/dev2/pki
export MG_NOM_MILLEGRILLE=dev2

export MG_MQ_CAFILE=$CERT_FOLDER/certs/dev2_CA_chain.cert.pem
export MG_MQ_CERTFILE=$CERT_FOLDER/certs/dev2_middleware.cert.pem
export MG_MQ_KEYFILE=$CERT_FOLDER/keys/dev2_middleware.key.pem

export CERT=$CERT_FOLDER/certs/dev2_fullchain.cert.pem
export PRIVKEY=$CERT_FOLDER/keys/dev2_middleware.key.pem
export MG_MQ_URL=amqps://dev2.local:5673/$MG_NOM_MILLEGRILLE
export PORT=3004

npm start
