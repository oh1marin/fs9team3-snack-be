#!/bin/bash
# EC2 서버 최초 설정 스크립트
# 사용법:
#   1) SSH 접속: ssh -i marin-pem-key.pem ec2-user@13.209.35.172
#   2) 레포 없으면: git clone https://github.com/oh1marin/fs9team3-snack-be.git ~/fs9team3-snack-be
#   3) 실행: cd ~/fs9team3-snack-be && chmod +x scripts/server-setup.sh && ./scripts/server-setup.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_PATH="$(dirname "$SCRIPT_DIR")"
cd "$DEPLOY_PATH"

echo "=== 1. Node.js 확인/설치 ==="
if ! command -v node &> /dev/null; then
  echo "Node.js 설치 중..."
  curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
  sudo dnf install -y nodejs
fi
node -v

echo ""
echo "=== 2. PM2 설치 ==="
if ! command -v pm2 &> /dev/null; then
  sudo npm i -g pm2
fi
pm2 -v

echo ""
echo "=== 3. 최신 코드 가져오기 ==="
git fetch origin main
git reset --hard origin/main

echo ""
echo "=== 4. .env 확인 ==="
if [ ! -f .env ]; then
  echo "⚠️  .env 파일이 없습니다!"
  echo "로컬에서 .env.ec2 내용을 서버로 복사해주세요:"
  echo "  scp -i marin-pem-key.pem .env.ec2 ec2-user@13.209.35.172:$DEPLOY_PATH/.env"
  echo ""
  echo "또는 nano .env 로 직접 생성 후 저장"
  exit 1
fi
echo ".env 확인됨"

echo ""
echo "=== 5. 의존성 설치 & 빌드 ==="
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build

echo ""
echo "=== 6. PM2 앱 시작/재시작 ==="
pm2 delete snack-be 2>/dev/null || true
pm2 start dist/app.js --name snack-be
pm2 save
pm2 startup 2>/dev/null || echo "(pm2 startup은 필요시 수동 실행)"

echo ""
echo "✅ 서버 설정 완료!"
