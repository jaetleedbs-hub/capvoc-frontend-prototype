# Nginx를 사용하여 정적 파일 서비스
FROM nginx:alpine

# Timezone 설정
ENV TZ=Asia/Seoul
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo "$TZ" > /etc/timezone

# Arguments
ARG USER_NAME=nginx
ARG USER_UID=1000
ARG USER_GID=1000

# Set working directory
WORKDIR /usr/share/nginx/html

# Nginx 기본 설정 파일 삭제
RUN rm /etc/nginx/conf.d/default.conf

# 사용자 정의 Nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/conf.d/

# Jenkins에서 빌드된 React 빌드 결과물 복사
COPY build /usr/share/nginx/html

# Set permissions for nginx user
RUN chown -R ${USER_UID}:${USER_GID} /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chown -R ${USER_UID}:${USER_GID} /var/cache/nginx && \
    chown -R ${USER_UID}:${USER_GID} /var/log/nginx && \
    chown -R ${USER_UID}:${USER_GID} /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R ${USER_UID}:${USER_GID} /var/run/nginx.pid

# Switch to the user
USER ${USER_UID}:${USER_GID}

# Expose port
EXPOSE 20080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]