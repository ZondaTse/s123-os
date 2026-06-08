#!/bin/bash
# 自动部署脚本：从GitHub raw拉最新文件
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
UPDATED=0
for f in "${FILES[@]}"; do
  if curl -sf --max-time 15 --retry 2 "$BASE/$f" -o "$DIR/$f" 2>/dev/null; then
    UPDATED=$((UPDATED+1))
  fi
done
echo "$(date): $UPDATED/${#FILES[@]} files updated"
pm2 restart s123 --silent
