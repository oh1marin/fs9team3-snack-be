# API 서버 HTTPS(443) 설정 (Certbot)

프론트가 `https://api.marin-snack.store`로 호출하므로 **443 포트에서 SSL**이 필요합니다.

## 전제 조건

- `api.marin-snack.store` DNS가 이 EC2 공인 IP(13.209.21.15)를 가리키고 있어야 함
- AWS 보안 그룹 **인바운드에 TCP 443** 허용 (0.0.0.0/0)

## 1. Certbot 설치 (Amazon Linux 2023)

```bash
sudo dnf install -y certbot python3-certbot-nginx
```

(Amazon Linux 2인 경우: `sudo yum install -y certbot python3-certbot-nginx`)

## 2. Certbot으로 인증서 발급 + Nginx 자동 설정

```bash
sudo certbot --nginx -d api.marin-snack.store
```

- 이메일 입력 (갱신 알림용)
- 이용약관 동의 (Y)
- Certbot이 **443 리스너와 SSL 설정을 Nginx에 자동 추가**합니다.

## 3. Nginx 재시작

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 4. 확인

```bash
sudo ss -tlnp | grep 443
```

`443`이 보이면 브라우저/프론트에서 `https://api.marin-snack.store` 호출이 가능합니다.

## 갱신 (자동)

```bash
sudo certbot renew --dry-run
```

실제 갱신은 cron/systemd 타이머로 자동 실행됩니다.
