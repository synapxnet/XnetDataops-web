# 使用 NGINX 1.24 镜像
FROM 127.0.0.1/library/nginx:1.24

# 删除 /usr/share/nginx/html 目录
RUN rm -rf /usr/share/nginx/html

# 复制 /apps/web-antd/dist 文件夹到 /usr/share/nginx/dist/
COPY apps/web-antd/dist /usr/share/nginx/dist/

# 重命名 /usr/share/nginx/dist 为 /usr/share/nginx/html
RUN mv /usr/share/nginx/dist /usr/share/nginx/html

# 调整 /usr/share/nginx/html 权限
RUN chown -R nginx:nginx /usr/share/nginx/html

COPY xnet.conf /etc/nginx/conf.d/default.conf

# 暴露 80 端口
EXPOSE 80

# 启动 NGINX
CMD ["nginx", "-g", "daemon off;"]
