#!/usr/bin/env bash
# ============================================================
# Capital Store MSK — установка на российский VPS (Ubuntu 22.04/24.04)
# Ставит Node, забирает код, поднимает автозапуск, Nginx и SSL.
# Запускать от root:  bash setup-vps.sh
# ============================================================
set -euo pipefail

DOMAIN="${DOMAIN:-capitalstoremsk.ru}"
EMAIL="${EMAIL:-capitalstoremsk@bk.ru}"
REPO_URL="${REPO_URL:-https://github.com/capital-store/108.git}"
APP_DIR="${APP_DIR:-/opt/capital-store}"
APP_PORT="${APP_PORT:-3000}"

# Секреты можно передать заранее:
#   TG_BOT_TOKEN=... TG_CHAT_ID=... bash setup-vps.sh
TG_BOT_TOKEN="${TG_BOT_TOKEN:-}"
TG_CHAT_ID="${TG_CHAT_ID:-}"
VK_GROUP_ID="${VK_GROUP_ID:-210723656}"
VK_TOKEN="${VK_TOKEN:-}"
# Запасной канал: у российских хостеров Telegram заблокирован, заявки идут через релей
RELAY_URL="${RELAY_URL:-https://capital-store-msk.onrender.com/api/order}"
# Для приватного репозитория: GITHUB_TOKEN=github_pat_... bash setup-vps.sh
GITHUB_TOKEN="${GITHUB_TOKEN:-}"

echo "==> 1/6 Пакеты"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl git nginx ca-certificates

echo "==> 2/6 Node.js"
if ! command -v node >/dev/null 2>&1; then
  # сначала NodeSource (Node 20); если дистрибутив не поддержан — берём из репозитория Ubuntu
  if curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1; then
    apt-get install -y -qq nodejs || true
  fi
  if ! command -v node >/dev/null 2>&1; then
    echo "    NodeSource недоступен для этой версии Ubuntu — ставлю nodejs из репозитория дистрибутива"
    apt-get install -y -qq nodejs
  fi
fi
NODE_BIN="$(command -v node)"
node -v
NODE_MAJOR="$(node -v | sed 's/^v\([0-9]*\).*/\1/')"
if [ "${NODE_MAJOR}" -lt 18 ]; then
  echo "!! Нужен Node 18 или новее, а установлен $(node -v). Останавливаюсь."
  exit 1
fi

echo "==> 3/6 Код проекта"
CLONE_URL="$REPO_URL"
if [ -n "$GITHUB_TOKEN" ]; then
  CLONE_URL="https://x-access-token:${GITHUB_TOKEN}@${REPO_URL#https://}"
fi
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" remote set-url origin "$CLONE_URL"
  git -C "$APP_DIR" fetch --all -q && git -C "$APP_DIR" reset --hard origin/main -q
else
  git clone -q "$CLONE_URL" "$APP_DIR"
fi
# не храним токен в конфиге git
git -C "$APP_DIR" remote set-url origin "$REPO_URL"

echo "==> 4/6 Настройки (.env)"
if [ ! -f "$APP_DIR/.env" ]; then
  cat > "$APP_DIR/.env" <<EOF
PORT=${APP_PORT}
VK_GROUP_ID=${VK_GROUP_ID}
VK_TOKEN=${VK_TOKEN}
VK_API_VERSION=5.199
TG_BOT_TOKEN=${TG_BOT_TOKEN}
TG_CHAT_ID=${TG_CHAT_ID}
RELAY_URL=${RELAY_URL}
EOF
  chmod 600 "$APP_DIR/.env"
  echo "    создан $APP_DIR/.env"
else
  echo "    .env уже есть — не трогаю"
fi

echo "==> 5/6 Автозапуск (systemd)"
cat > /etc/systemd/system/capital-store.service <<EOF
[Unit]
Description=Capital Store MSK
After=network.target

[Service]
Type=simple
WorkingDirectory=${APP_DIR}
ExecStart=${NODE_BIN} ${APP_DIR}/server.js
Restart=always
RestartSec=3
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable capital-store >/dev/null 2>&1
systemctl restart capital-store
sleep 2
systemctl is-active --quiet capital-store && echo "    сервис запущен" || {
  echo "    !! сервис не поднялся, логи:"; journalctl -u capital-store -n 30 --no-pager; exit 1; }

echo "==> 6/6 Nginx + SSL"
cat > /etc/nginx/sites-available/capital-store <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name ${DOMAIN} www.${DOMAIN} _;

    client_max_body_size 10m;
    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
ln -sf /etc/nginx/sites-available/capital-store /etc/nginx/sites-enabled/capital-store
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

apt-get install -y -qq certbot python3-certbot-nginx
if certbot --nginx -d "${DOMAIN}" -d "www.${DOMAIN}" \
      --non-interactive --agree-tos -m "${EMAIL}" --redirect; then
  echo "    SSL выпущен"
else
  echo "    !! SSL пока не выпустился — обычно потому, что DNS ещё не указывает на этот сервер."
  echo "       Поменяй A-запись домена на IP этого сервера и повтори:"
  echo "       certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --redirect"
fi

echo
echo "============================================"
echo " Готово. Сайт: http://${DOMAIN}"
echo " Логи:      journalctl -u capital-store -f"
echo " Рестарт:   systemctl restart capital-store"
echo " Обновить:  cd ${APP_DIR} && git pull && systemctl restart capital-store"
echo "============================================"
