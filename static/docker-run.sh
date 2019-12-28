source image_info.txt

ARCH=`uname -m`
IMAGENAME="$NAME:${ARCH}_${VERSION}"

docker run --rm -it \
      --mount "type=bind,source=/home/mathieu/mgdev,target=/certs" \
      --env LOCAL_CERT=/certs/local/local.cert.pem \
      --env LOCAL_KEY=/certs/local/local.key.pem \
      -p 8443:443 \
      $IMAGENAME bash
