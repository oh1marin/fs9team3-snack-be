# GitHub Actions CI/CD 설정

## CI (자동 테스트/빌드)
- **트리거**: `main`, `develop` 브랜치 push/PR 시
- **실행**: `npm ci` → `npm test` → `npm run build`

## CD (배포)
- **트리거**: `main` 브랜치 push 시
- **deploy.yml**: 테스트 → 빌드 → tar → scp → SSH로 서버 배포

## 필요한 GitHub Secrets
레포지토리 **Settings → Secrets and variables → Actions** 에 추가:

| Secret | 설명 |
|--------|------|
| `EC2_HOST` | 배포 서버 IP (예: `13.209.35.172`) |
| `EC2_USERNAME` | SSH 로그인 사용자 (예: `ec2-user`) |
| `EC2_PRIVATE_KEY` | SSH 비밀키(PEM) 전체 내용 |
| `DEPLOY_PATH` | 서버 내 앱 디렉토리 (예: `/home/ec2-user/fs9team3-snack-be`) |
| `ENV` | .env 파일 전체 내용 (.env.ec2 내용 복사) |

## 서버 사전 준비
한 번만 실행하면 됩니다:

```bash
# 1. SSH 접속
ssh -i marin-pem-key.pem ec2-user@13.209.35.172

# 2. 레포 없으면 클론
git clone https://github.com/oh1marin/fs9team3-snack-be.git ~/fs9team3-snack-be

# 3. .env 복사 (로컬에서 실행 - 프로젝트 폴더에서)
scp -i marin-pem-key.pem .env.ec2 ec2-user@13.209.35.172:~/fs9team3-snack-be/.env

# 4. 설정 스크립트 실행 (서버에서)
cd ~/fs9team3-snack-be && chmod +x scripts/server-setup.sh && ./scripts/server-setup.sh
```
