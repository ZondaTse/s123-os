#!/bin/bash
# 自动部署脚本：从GitHub raw拉最新文件（并发下载）
BASE="https://raw.githubusercontent.com/ZondaTse/s123-os/main"
DIR="/root/s123"
FILES=(
  "app.js" "db/index.js"
  "routes/auth.js" "routes/messages.js" "routes/tasks.js"
  "routes/products.js" "routes/contents.js" "routes/experiences.js"
  "routes/plans.js" "routes/gmv.js" "routes/users.js"
  "routes/moments.js" "routes/kuaima.js" "routes/sse.js"
  "public/index.html" "public/css/app.css"
  "public/js/utils.js" "public/js/chat.js"
  "public/js/exec.js" "public/js/wealth.js"
)

# 并发下载
for f in "${FILES[@]}"; do
  curl -sf --max-time 10 "$BASE/$f" -o "$DIR/$f" &
done
wait

echo "$(date): deploy done"
pm2 restart s123 --silent
