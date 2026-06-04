#!/bin/bash
# S123 OS 一键部署脚本
# 用法: bash deploy.sh

set -e

REMOTE="root@119.91.45.151"
REMOTE_DIR="/root/s123"
LOCAL_DIR="/root/s123"

echo "📦 打包前端文件..."
cd $LOCAL_DIR/public
tar -czf /tmp/s123_frontend.tar.gz css/ js/ index.html

echo "🚀 上传到服务器..."
scp /tmp/s123_frontend.tar.gz $REMOTE:$REMOTE_DIR/public/

echo "🔄 解压并重启..."
ssh $REMOTE "cd $REMOTE_DIR/public && tar -xzf s123_frontend.tar.gz && rm s123_frontend.tar.gz && pm2 restart s123"

echo "✅ 部署完成"
