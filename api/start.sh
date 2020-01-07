#!/usr/bin/env bash

CERT_FOLDER=/home/mathieu/mgdev/certs
export MG_IDMG=bKKwtXC68HR4TPDzet6zLVq2wPJfc9RiiYLuva

export MG_MQ_CAFILE=$CERT_FOLDER/pki.racine.cert
export MG_MQ_CERTFILE=$CERT_FOLDER/pki.vitrine.fullchain
export MG_MQ_KEYFILE=$CERT_FOLDER/pki.vitrine.key
export CERT=$MG_MQ_CERTFILE
export PRIVKEY=$MG_MQ_KEYFILE

export MG_MQ_URL=amqps://mg-dev3.local:5673/$MG_IDMG

export PORT=3004

export DATA_FOLDER=/home/mathieu/git/MilleGrilles.vitrine/api/public/data

npm start
