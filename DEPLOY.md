# AWS 배포 가이드 (fs9team3-snack-be)

팀장 권장 가이드 기반 프로젝트 적용 버전입니다.

---

## 1. EC2 인스턴스 생성

- [ ] 리전: **서울(ap-northeast-2)** 선택
- [ ] AMI: Amazon Linux 2023
- [ ] 인스턴스 유형: t2.micro (프리 티어)
- [ ] 키 페어: `.pem` 형식, 안전한 폴더에 보관 (`.ssh/` 권장)
- [ ] 인바운드 규칙: **포트 3001** (Express 서버) - 사용자 지정 TCP, 내 IP
- [ ] (선택) 탄력적 IP 적용 → 사용 후 릴리즈 (프리티어 아님)

---

## 2. RDS PostgreSQL 생성

- [ ] 엔진: **PostgreSQL**
- [ ] 템플릿: **프리 티어**
- [ ] DB 인스턴스 식별자, 마스터 암호 설정
- [ ] **연결**: "EC2 컴퓨팅 리소스에 연결" → 위에서 만든 EC2 선택
- [ ] 추가 구성 → 자동 백업 비활성화 (비용 절감)

---

## 3. DBeaver 연결 (SSH 터널)

1. PostgreSQL 연결 추가
2. **Main 탭**: Host `localhost`, Port `5433`, Database `postgres`, User/Password
3. **SSH 탭**: Use SSH Tunnel → EC2 퍼블릭 IP, `.pem` 키 경로
4. Test Connection → Finish
5. `CREATE DATABASE snack_db;` 실행 후 연결 대상 DB를 `snack_db`로 변경

---

## 4. 로컬 개발 (.env)

`.env.example`을 복사해 `.env`로 만들고, 아래 변수들을 본인 환경에 맞게 채우세요.

| 변수 | 설명 |
|------|------|
| `DATABASE_URL` | SSH 터널 시: `localhost:5433` / RDS 유저, 비밀번호, DB이름 |
| `SSH_KEY_PATH` | .pem 키 파일 경로 |
| `EC2_HOST` | EC2 퍼블릭 IP |
| `EC2_USER` | ec2-user (Amazon Linux 기본값) |
| `DB_HOST` | RDS 엔드포인트 주소 |

### SSH 터널 실행

```bash
# 터미널 1: SSH 터널 유지 (Git Bash 또는 WSL)
npm run ssh

# 터미널 2: 서버 실행
yarn dev
```

**Windows**: `npm run ssh`는 Git Bash 또는 WSL에서 실행하세요.

---

## 5. S3 버킷 (이미지 업로드)

- [ ] 퍼블릭 버킷 1개 (상품 이미지)
- [ ] 프라이빗 버킷 1개 (선택)
- [ ] IAM 사용자 생성 → S3 PutObject/GetObject 정책 연결 → 액세스 키 발급
- [ ] IAM 액세스 키 발급 후 `.env`에 `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_PUBLIC_BUCKET_NAME`, `AWS_PRIVATE_BUCKET_NAME` 추가

---

## 6. 상품 등록 API (이미지 업로드)

- **multipart/form-data**: `title`, `price`, `category_main`, `category_sub`, `image`(파일)
- **application/json**: `title`, `price`, `image`(URL), `category_main`, `category_sub`

```http
POST /api/items
Content-Type: multipart/form-data
Authorization: Bearer {액세스토큰}

# 폼 필드: title, price, category_main, category_sub, image(파일)
```

---

## 7. EC2에서 PM2로 서버 실행 및 테스트

EC2에 SSH 접속한 뒤, 백엔드를 PM2로 띄우고 **서버 안에서** 동작 여부를 확인하는 방법입니다.

### 7-1. EC2 접속 후 앱 실행 (PM2)

```bash
# EC2 SSH 접속 (Git Bash / WSL, .pem 경로는 본인 환경에 맞게)
ssh -i "경로/키.pem" ec2-user@3.37.235.204

# Node 설치 확인 (Amazon Linux 2023)
node -v
npm -v

# 프로젝트 폴더로 이동 (클론한 경로)
cd ~/fs9team3-snack-be   # 실제 경로로 변경

# 의존성 설치 & 빌드
yarn install
yarn build

# .env 설정 (RDS, S3 등 서버용 값으로)
# vi .env 또는 nano .env

# PM2 전역 설치 (없다면)
sudo npm install -g pm2

# PM2로 서버 실행 (dist/app.js 기준)
pm2 start dist/app.js --name snack-be

# 재부팅 후에도 살리려면 (선택)
pm2 save
pm2 startup   # Linux에서만 동작, 나온 명령어 그대로 실행
```

### 7-2. PM2 테스트 (서버 안에서 확인)

**아래 명령은 전부 EC2 SSH 접속한 터미널에서 실행하세요.**

| 명령 | 의미 |
|------|------|
| `pm2 list` | 실행 중인 프로세스 목록 (snack-be가 online인지 확인) |
| `pm2 logs snack-be` | snack-be 로그 실시간 확인 |
| `pm2 monit` | CPU/메모리 등 모니터링 (종료: q) |
| `curl -s http://localhost:3001` | **서버 내부에서** 3001 포트 응답 테스트 |

**정상이면:** `curl http://localhost:3001` 실행 시 HTML 또는 JSON이 출력됩니다.  
이게 되면 **PM2로 앱은 정상 동작**하는 것이고, 밖에서 안 되는 건 방화벽/보안 그룹 문제입니다.

### 7-3. `GET http://3.37.235.204:3001` 이 안 될 때

DEPLOY.md 1번에 **인바운드 규칙: 포트 3001, "내 IP"** 로 되어 있으면:

- **내 IP** = 보안 그룹 설정할 때의 그 PC IP만 허용됨.
- 집/회사/카페 등 **다른 IP**에서는 `3.37.235.204:3001` 접속이 **차단**됩니다 (타임아웃).

**조치:**

1. **AWS 콘솔** → EC2 → 해당 인스턴스 → **보안** 탭 → 보안 그룹 클릭.
2. **인바운드 규칙 편집** → 3001 규칙에 **지금 쓰는 PC의 IP** 추가하거나, 테스트용으로 **0.0.0.0/0** (전체 허용) 추가.
3. 저장 후 다시 `GET http://3.37.235.204:3001` 호출.

정리: **PM2 테스트** = EC2 안에서 `pm2 list` → `curl http://localhost:3001` 로 확인.  
밖에서 접속은 보안 그룹에서 3001 허용된 IP인지 확인하면 됩니다.

### 7-4. EC2에 프로젝트가 없을 때 (배포)

`ls ~/fs9team3-snack-be` 했을 때 **No such file or directory** 나오면, EC2에 코드가 없는 상태입니다. 아래 중 하나로 올린 뒤 7-1(빌드·PM2 시작)을 진행하세요.

**방법 A: GitHub에 push 후 EC2에서 clone**

1. 로컬에서 저장소 push (이미 되어 있으면 생략)
2. EC2 SSH 접속 후:
   ```bash
   cd ~
   git clone https://github.com/oh1marin/fs9team3-snack-be.git
   cd fs9team3-snack-be
   ```
3. Node/Yarn 설치 (Amazon Linux 2023):
   ```bash
   sudo dnf install -y nodejs
   curl -sL https://dl.yarnpkg.com/rpm/yarn.repo | sudo tee /etc/yum.repos.d/yarn.repo
   sudo dnf install -y yarn
   ```
4. 의존성·빌드·환경변수:
   ```bash
   yarn install
   yarn build
   # .env 생성 (vi .env 또는 nano .env) - DATABASE_URL(RDS), JWT 등 서버용 값
   ```
5. PM2로 실행:
   ```bash
   sudo npm install -g pm2
   pm2 start dist/app.js --name snack-be
   pm2 save
   pm2 startup   # 나온 명령 그대로 실행 (재부팅 시 자동 시작)
   ```

**방법 B: 로컬에서 압축 후 scp로 보내기**

1. **Windows PowerShell** (로컬, 프로젝트 폴더에서):
   - `node_modules` 제외하고 압축하거나, 그냥 전체 폴더 압축
   - 예: `Compress-Archive -Path src, prisma, public, nginx, package.json, tsconfig.json, yarn.lock, .env.example -DestinationPath fs9team3-snack-be.zip`
   - 또는 탐색기에서 `node_modules` 빼고 폴더 압축
2. EC2로 전송:
   ```powershell
   scp -i "C:\Users\marin\Downloads\marin-pem-key.pem" fs9team3-snack-be.zip ec2-user@3.37.235.204:~/
   ```
3. EC2에서:
   ```bash
   cd ~
   unzip -o fs9team3-snack-be.zip -d fs9team3-snack-be
   cd fs9team3-snack-be
   yarn install
   yarn build
   # .env 만들기 (RDS, JWT 등)
   pm2 start dist/app.js --name snack-be
   pm2 save
   ```

배포 후 `curl -s http://127.0.0.1:3001` 로 API 응답 확인.

---

## 8. NGINX 리버스 프록시 (선택)

API를 80/443 포트로 노출하고 싶을 때 NGINX를 앞단에 둡니다.  
Express(3001)는 그대로 두고, NGINX가 80에서 받아 3001로 전달합니다.

### 8-1. 설정 파일 위치

프로젝트에 포함된 설정:

- `nginx/snack-be.conf`

**server_name** 은 필요 시 도메인으로 수정 (예: `api.example.com`).

### 8-2. Windows에서 NGINX 설치 및 적용

1. **다운로드**  
   https://nginx.org/en/download.html → Windows용 stable 압축 받기.

2. **압축 해제**  
   예: `C:\nginx`

3. **설정 복사**  
   - `C:\project\fs9team3-snack-be\nginx\snack-be.conf` 내용을  
   - `C:\nginx\conf\` 아래에 넣기 (예: `C:\nginx\conf\conf.d\snack-be.conf`).  
   - 또는 `C:\nginx\conf\nginx.conf` 안에 `http { ... }` 블록 안에  
     `include C:/project/fs9team3-snack-be/nginx/snack-be.conf;` 한 줄 추가.

4. **설정 검사 후 재시작**
   ```powershell
   cd C:\nginx
   .\nginx.exe -t
   .\nginx.exe -s reload
   ```
   (처음이면 `.\nginx.exe` 만 실행)

5. **방화벽**  
   Windows 방화벽에서 **인바운드 80** 허용.

이후 브라우저에서 `http://localhost` 로 접속하면 API(3001)로 프록시됩니다.

### 8-3. EC2 (Amazon Linux 2023)에서 NGINX 설치 및 적용

```bash
# NGINX 설치
sudo dnf install -y nginx

# 프로젝트 설정 복사 (클론 경로는 본인에 맞게)
sudo cp /home/ec2-user/fs9team3-snack-be/nginx/snack-be.conf /etc/nginx/conf.d/snack-be.conf

# 기본 default 설정 비활성 (선택)
# sudo mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak

# 설정 검사
sudo nginx -t

# NGINX 시작 및 부팅 시 자동 시작
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl reload nginx
```

**보안 그룹:**  
- NGINX를 쓰면 **80**(및 필요 시 **443**) 인바운드 허용.  
- 3001은 외부에 열지 않고, NGINX만 80/443으로 받도록 두면 됨.

### 8-4. 동작 확인

- **직접 Express:** `http://서버IP:3001` → API 응답  
- **NGINX 경유:** `http://서버IP` 또는 `http://서버IP/api/...` → 같은 API 응답

로컬: `http://localhost`  
EC2: `http://EC2퍼블릭IP`
