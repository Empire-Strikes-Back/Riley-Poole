#!/bin/bash

build(){
  rimraf dist && cross-env NODE_ENV=production tsc
}

dev(){
  cross-env NODE_ENV=development nodemon --watch ./ --exec ts-node src/index.ts
}

main(){
  node dist/index.js
}

dev_ui(){
  cross-env NODE_ENV=development webpack-dev-server
}

webpack(){
  cross-env NODE_ENV=production webpack
}

build_ui(){
  rimraf dist && npm run webpack  && mkdirp dist && ncp static dist
}

server(){
  npm run build && http-server -p 1818 dist
}

NGINX_VERSION 1.13.3
NGINX_TS_VERSION 0.1.1

nginx_ts_download(){

  set -x && \
  wget http://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz && \
  tar zxf nginx-${NGINX_VERSION}.tar.gz && \
  rm nginx-${NGINX_VERSION}.tar.gz && \
  # get nginx-rtmp module
  wget https://github.com/arut/nginx-ts-module/archive/v${NGINX_TS_VERSION}.tar.gz && \
  tar zxf v${NGINX_TS_VERSION}.tar.gz && \
  rm v${NGINX_TS_VERSION}.tar.gz
}

nginx_ts_compile(){
  set -x && \
  ./configure --with-http_ssl_module \
  --add-module=/src/nginx-ts-module-${NGINX_TS_VERSION} \
  --with-http_stub_status_module \
  --conf-path=/config/nginx.conf \
  --error-log-path=/logs/error.log \
  --http-log-path=/logs/access.log && \
  make && \
  make install
}

# ffmpeg -re -y -use_wallclock_as_timestamps 1 -i http://host:6400 -c libx264 -f mpegts http://127.0.0.1:3040/publish/http

# rtsp://host:554/16   4.73

# rtsp://host:554/18

# rtsp://host:554/77  4.72


# ffmpeg -re -rtsp_transport tcp -i rtsp://host:554/77 -c libx264 -f mpegts http://127.0.0.1:8080/publish/rtsp

# ffmpeg -re -y -use_wallclock_as_timestamps 1 -i http://host:6400 -c:v libx264 -f flv http://127.0.0.1:3055/hls/http

NGINX_VERSION nginx-1.12.1
NGINX_RTMP_MODULE_VERSION 1.2.0

nginx_rtmp_download(){

  # Download and decompress Nginx
  mkdir -p /tmp/build/nginx && \
    cd /tmp/build/nginx && \
    wget -O ${NGINX_VERSION}.tar.gz https://nginx.org/download/${NGINX_VERSION}.tar.gz && \
    tar -zxf ${NGINX_VERSION}.tar.gz

  # Download and decompress RTMP module
  mkdir -p /tmp/build/nginx-rtmp-module && \
    cd /tmp/build/nginx-rtmp-module && \
    wget -O nginx-rtmp-module-${NGINX_RTMP_MODULE_VERSION}.tar.gz https://github.com/arut/nginx-rtmp-module/archive/v${NGINX_RTMP_MODULE_VERSION}.tar.gz && \
    tar -zxf nginx-rtmp-module-${NGINX_RTMP_MODULE_VERSION}.tar.gz && \
    cd nginx-rtmp-module-${NGINX_RTMP_MODULE_VERSION}

  # Build and install Nginx
  # The default puts everything under /usr/local/nginx, so it's needed to change
  # it explicitly. Not just for order but to have it in the PATH

  
  
}

nginx_rtmp_compile(){
  cd /tmp/build/nginx/${NGINX_VERSION} && \
    ./configure \
        --sbin-path=/usr/local/sbin/nginx \
        --conf-path=/etc/nginx/nginx.conf \
        --error-log-path=/var/log/nginx/error.log \
        --pid-path=/var/run/nginx/nginx.pid \
        --lock-path=/var/lock/nginx/nginx.lock \
        --http-log-path=/var/log/nginx/access.log \
        --http-client-body-temp-path=/tmp/nginx-client-body \
        --with-http_ssl_module \
        --with-threads \
        --with-ipv6 \
        --add-module=/tmp/build/nginx-rtmp-module/nginx-rtmp-module-${NGINX_RTMP_MODULE_VERSION} && \
    make -j $(getconf _NPROCESSORS_ONLN) && \
    make install && \
    mkdir /var/lock/nginx && \
    rm -rf /tmp/build
}

"$@"