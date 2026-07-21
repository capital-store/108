# Переезд на российский VPS

Инструкция для переноса сайта с Render на VPS в России (Timeweb Cloud, Beget, Selectel, reg.ru — любой).

## 1. Купить сервер

Минимальный тариф, этого хватает с запасом:
- **1 ядро, 1 ГБ RAM, 10–15 ГБ диска**
- ОС: **Ubuntu 24.04** (или 22.04)
- Регион: Россия (Москва / СПб)
- Цена: ~250–400 ₽/мес

После создания записать **IP-адрес** и **пароль root**.

## 2. Открыть консоль сервера

В панели хостинга есть веб-консоль (SSH-клиент устанавливать не нужно).
Либо с компьютера: `ssh root@IP_СЕРВЕРА`

## 3. Запустить установку

Одной командой (подставить свои токены Telegram):

```bash
curl -fsSL https://raw.githubusercontent.com/capital-store/108/main/deploy/setup-vps.sh -o setup.sh && \
TG_BOT_TOKEN='токен_бота' \
TG_CHAT_ID='993987919' \
bash setup.sh
```

Если репозиторий приватный — добавить `GITHUB_TOKEN='github_pat_...'` перед `bash setup.sh`
(либо сделать репозиторий публичным — секретов в нём нет, `.env` в git не попадает).

Скрипт сам поставит Node 20, заберёт код, поднимет автозапуск (systemd), настроит Nginx и выпустит SSL.

## 4. Переключить домен

В reg.ru → управление зоной DNS:
- **A** `@` → `IP_НОВОГО_СЕРВЕРА` (вместо `216.24.57.1`)
- **A** `www` → `IP_НОВОГО_СЕРВЕРА` (вместо CNAME на Render)

Подождать 10–60 минут, затем на сервере повторить выпуск сертификата, если он не встал сразу:

```bash
certbot --nginx -d capitalstoremsk.ru -d www.capitalstoremsk.ru --redirect
```

## 5. Проверить

```bash
systemctl status capital-store     # сервис запущен?
journalctl -u capital-store -f     # логи в реальном времени
```

## Обновление сайта в будущем

После `git push` в GitHub:

```bash
cd /opt/capital-store && git pull && systemctl restart capital-store
```

## Полезное

| Действие | Команда |
|---|---|
| Перезапустить | `systemctl restart capital-store` |
| Логи | `journalctl -u capital-store -f` |
| Изменить токены | `nano /opt/capital-store/.env` затем перезапуск |
| Проверить Nginx | `nginx -t && systemctl reload nginx` |

Секреты (токены) лежат только в `/opt/capital-store/.env` с правами 600 — в git они не попадают.
