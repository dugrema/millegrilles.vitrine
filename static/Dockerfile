FROM nginx:1.17
MAINTAINER Mathieu Dugre <mail@mdugre.info>

ENV APP_BUNDLE_DIR=/opt/nginx/dist \
    APP_HTML_DEST=/usr/share/nginx/html

EXPOSE 80 443

VOLUME /etc/nginx/conf.d /usr/share/nginx/html

CMD ["/opt/nginx/dist/run.sh"]

# Copier contenu static et react dans l'image
COPY sites-available/ scripts/run.sh $APP_BUNDLE_DIR/
COPY sites-available/default.conf /etc/nginx/conf.d
RUN chmod 755 $APP_BUNDLE_DIR/run.sh

COPY html/* react_build/build/ $APP_HTML_DEST/

WORKDIR $APP_BUNDLE_DIR
