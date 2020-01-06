source image_info.txt

ARCH=`uname -m`
IMAGENAME="$NAME:${ARCH}_${VERSION}"

docker run --rm -it \
      --mount "type=bind,source=/home/mathieu/mgdev/certs,target=/certs" \
      --mount "type=bind,source=/home/mathieu/mgdev/millegrilles,target=/usr/share/nginx/millegrilles" \
      --env LISTE_MILLEGRILLES='IDMG=33KRMhqcWCKvMHyY5xymMCUEbT53Kg1NqUb9AU6:WEB_URL=mg-dev3.maple.maceroc.com:WEB_CERT=/certs/33KRMhqcWCKv.pki.nginx.fullchain.20191219a:WEB_KEY=/certs/33KRMhqcWCKv.pki.nginx.key.20191219a' \
      -p 6443:443 \
      $IMAGENAME bash
