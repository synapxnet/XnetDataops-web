# 使用官方 Nginx 镜像作为基础镜像
FROM 127.0.0.1/library/nginx:alpine

# 设置工作目录
WORKDIR /usr/share/nginx/html

# 删除 Nginx 默认的静态文件
RUN rm -rf ./*

# 复制编译后的 dist 文件到 Nginx 的默认静态文件目录
COPY /apps/web-antd/dist .
COPY /deploy/xnet.conf /etc/nginx/conf.d/default.conf


# 暴露 Nginx 默认端口
EXPOSE 80

# 启动 Nginx 服务
CMD ["nginx", "-g", "daemon off;"]
