#!/bin/bash
# 自动部署脚本：从GitHub raw拉最新文件（安全下载，防截断）
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
  "public/salary.html" "public/salary-body.html"
  "public/salary-app.js" "public/salary-styles.css"
)

# 安全下载：先存临时文件，成功才覆盖原文件
safe_download() {
  local f="$1"
  local tmp="$DIR/$f.tmp"
  local dest="$DIR/$f"
  if curl -sf --max-time 15 "$BASE/$f" -o "$tmp"; then
    # 检查下载文件非空
    if [ -s "$tmp" ]; then
      mv "$tmp" "$dest"
    else
      rm -f "$tmp"
    fi
  else
    rm -f "$tmp"
  fi
}

for f in "${FILES[@]}"; do
  safe_download "$f" &
done
wait

echo "$(date): deploy done"
pm2 restart s123 --silent
