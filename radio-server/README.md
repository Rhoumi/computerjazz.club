# CJC Radio — Déploiement LibreTime

Stack : LibreTime + Icecast via Docker, Caddy comme reverse proxy SSL.

URLs résultantes :
- `https://radio.computerjazz.club` → interface LibreTime (admin + schedule public)
- `https://radio.computerjazz.club/stream/main` → flux Icecast (MP3 256k)
- `https://radio.computerjazz.club/stream/status-json.xsl` → métadonnées "now playing"

---

## Prérequis VPS

- Ubuntu 22.04 / Debian 12 (ou équivalent)
- DNS : `radio.computerjazz.club` → IP du VPS (enregistrement A)
- Ports 80 et 443 ouverts dans le firewall

---

## 1. Installer Docker et Caddy

```bash
# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker

# Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

---

## 2. Copier les fichiers sur le VPS

```bash
scp -r radio-server/ user@TON_VPS:/opt/libretime/
ssh user@TON_VPS
cd /opt/libretime
```

---

## 3. Configurer les variables d'environnement

```bash
cp .env.example .env

# Générer des mots de passe sécurisés
echo "LIBRETIME_API_KEY=$(openssl rand -hex 32)"
echo "LIBRETIME_SECRET_KEY=$(openssl rand -hex 32)"
echo "POSTGRES_PASSWORD=$(openssl rand -hex 16)"
echo "RABBITMQ_DEFAULT_PASS=$(openssl rand -hex 16)"
echo "ICECAST_SOURCE_PASSWORD=$(openssl rand -hex 16)"
echo "ICECAST_ADMIN_PASSWORD=$(openssl rand -hex 16)"
echo "ICECAST_RELAY_PASSWORD=$(openssl rand -hex 16)"

# Coller les valeurs générées dans .env
nano .env
```

---

## 4. Générer config.yml depuis le template

```bash
source .env
envsubst < config.template.yml > config.yml
```

---

## 5. Démarrer LibreTime

```bash
# Initialiser la base de données
docker compose run --rm api libretime-api migrate

# Lancer tous les services
docker compose up -d

# Vérifier que tout tourne
docker compose ps
```

---

## 6. Configurer Caddy

```bash
sudo cp Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Caddy obtient automatiquement un certificat Let's Encrypt pour `radio.computerjazz.club`.

---

## 7. Premier accès

Ouvre `https://radio.computerjazz.club` dans un navigateur.

Identifiants par défaut : `admin` / `admin`  
**→ Change le mot de passe immédiatement** dans Settings > Users.

Dans Settings > General, vérifie que la "Station URL" correspond à `https://radio.computerjazz.club`.

---

## 8. Tester le flux

```bash
# Doit retourner du JSON avec les métadonnées du flux
curl https://radio.computerjazz.club/stream/status-json.xsl
```

Le player sur `computerjazz.club/radio/` se connecte automatiquement au flux.

---

## Mise à jour

```bash
# Dans /opt/libretime
docker compose pull
docker compose up -d
docker compose run --rm api libretime-api migrate
```
