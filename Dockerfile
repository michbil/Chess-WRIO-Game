FROM mhart/alpine-node:7
MAINTAINER denso.ffff@gmail.com

#RUN apk add --no-cache make gcc g++ python
RUN npm install -g gulp yarn@0.18


COPY package.json /srv/package.json
RUN cd /srv/ && npm install #
COPY . /srv/www/

EXPOSE 5005
CMD cd /srv/www/ && rm -fr node_modules && gulp watch