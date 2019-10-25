#!/usr/bin/env bash

CERT_FOLDER=/home/mathieu/mgdev/certs
export MG_NOM_MILLEGRILLE=dev3

export MG_MQ_CAFILE=$CERT_FOLDER/pki.ca.root.cert
export MG_MQ_CERTFILE=$CERT_FOLDER/pki.nginx.fullchain
export MG_MQ_KEYFILE=$CERT_FOLDER/pki.nginx.key
export CERT=$MG_MQ_CERTFILE
export PRIVKEY=$MG_MQ_KEYFILE

export MG_MQ_URL=amqps://mg-dev3.local:5673/$MG_NOM_MILLEGRILLE

export PORT=3004

npm start
