source image_info.txt

ARCH=`uname -m`
IMAGENAME="$NAME:${ARCH}_${VERSION}"

docker run --rm -it \
      --mount "type=bind,source=/home/mathieu/mgdev/certs,target=/certs" \
      --mount "type=bind,source=/home/mathieu/mgdev/millegrilles,target=/usr/share/nginx/millegrilles" \
      --env IDMG_33KRMhqcWCKvMHyY5xymMCUEbT53Kg1NqUb9AU6='WEB_URL=mg-dev3.maple.maceroc.com WEB_CERT=/certs/bKKwtXC68HR4.pki.vitrine.fullchain.20200106a WEB_KEY=/certs/bKKwtXC68HR4.pki.vitrine.key.20200106a' \
      -p 6443:443 -p 6080:80 \
      $IMAGENAME bash
