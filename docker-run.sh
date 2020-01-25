#!/usr/bin/env bash
source image_info.txt

CERT_FOLDER=/home/mathieu/mgdev/certs
LOCAL_DATA_FOLDER=/home/mathieu/git/MilleGrilles.vitrine/api/public/data

export MG_IDMG=bKKwtXC68HR4TPDzet6zLVq2wPJfc9RiiYLuva
export MG_MQ_URL=amqps://mg-dev3.local:5673/$MG_IDMG
export DATA_FOLDER=/opt/millegrilles/data
export WEB_URL=https://mg-dev3.maple.maceroc.com

export MG_MQ_CAFILE=/run/secrets/bKKwtXC68HR4.pki.racine.cert.20200106a
export MG_MQ_CERTFILE=/run/secrets/bKKwtXC68HR4.pki.vitrine.fullchain.20200106a
export MG_MQ_KEYFILE=/run/secrets/bKKwtXC68HR4.pki.vitrine.key.20200106a
export CERT=$MG_MQ_CERTFILE
export PRIVKEY=$MG_MQ_KEYFILE

# docker run --rm \
#   -p 80:80 \
#   -p 443:443 \
#   -v $CONF_FOLDER:/etc/nginx/conf.d \
#   -v /home/mathieu/mgdev/certs:/certs \
#   $REPO/$NAME:$VERSION

docker run --rm \
  --network host \
  --mount type=bind,source=$CERT_FOLDER,target=/run/secrets \
  --mount type=bind,source=$LOCAL_DATA_FOLDER,target=/opt/millegrilles/data \
  -e MG_IDMG -e MG_MQ_URL -e DATA_FOLDER -e WEB_URL \
  -e MG_MQ_CAFILE -e MG_MQ_CERTFILE -e MG_MQ_KEYFILE -e CERT -e PRIVKEY \
  --add-host mg-dev3.local:127.0.1.1 \
  $REPO/$NAME:x86_64_$VERSION
