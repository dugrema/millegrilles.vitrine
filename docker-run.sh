#!/bin/bash

source image_info.txt
ARCH=`uname -m`

# Override version (e.g. pour utiliser x86_64_...)
# VERSION=x86_64_1.29.3
IMAGE_DOCKER=$REPO/${NAME}:${ARCH}_${VERSION}

echo Image docker : $IMAGE_DOCKER

# MQ
export HOST=mg-dev4.maple.maceroc.com
export HOST_MQ=mg-dev4

CERT_FOLDER=/home/mathieu/mgdev/certs
export MG_MQ_CAFILE=/certs/pki.millegrille.cert
export MG_MQ_CERTFILE=/certs/pki.web_protege.cert
export MG_MQ_KEYFILE=/certs/pki.web_protege.key
export MG_MQ_URL=amqps://$HOST_MQ:5673
export PORT=3000

export MG_NOEUD_ID=4af8f982-bf70-45c8-9be4-92a862419ec0

# export DEBUG=millegrilles:*,coupdoeil:*
export DEBUG=millegrilles:common:server3,millegrilles:vitrine

docker run --rm -it \
  --network host \
  -v /home/mathieu/mgdev/certs:/certs \
  -v /var/opt/millegrilles/nginx/data:/var/opt/millegrilles/nginx/data \
  -e MG_MQ_CAFILE -e MG_MQ_CERTFILE -e MG_MQ_KEYFILE \
  -e MG_MQ_URL -e HOST -e PORT -e MG_NOEUD_ID \
  -e DEBUG -e DEV=1 \
  $IMAGE_DOCKER
