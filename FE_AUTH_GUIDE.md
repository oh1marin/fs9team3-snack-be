# FE 인증·토큰 연동 가이드

## 1. 토큰 구조

| 토큰 | 만료 | 용도 |
|------|------|------|
| **accessToken** | 10분 | API 인증 (Authorization 헤더 또는 쿠키) |
| **refreshToken** | 24시간 | 만료 시 새 토큰 발급용 |

- 로그인/회원가입 시 **둘 다** 발급됨
- **credentials: 'include'** 필수 (쿠키 전송)
- BE가 `httpOnly` 쿠키로 설정 → FE는 필요 시 JSON 응답의 `accessToken`, `refreshToken`을 메모리/스토리지에 저장

---

## 2. API 엔드포인트

### POST /api/auth/login

**요청**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**성공 응답 (200)**
```json
{
  "success": true,
  "message": "로그인 성공! 👋",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "nickname": "user",
    "is_admin": "N",
    "is_super_admin": "N"
  },
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}
```

- 쿠키: `accessToken`, `refreshToken` 자동 설정

---

### POST /api/auth/signup

**요청**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "token": "초대링크토큰(선택)"
}
```

- `token` 또는 `invitationToken`: 초대 링크의 쿼리 파라미터 값 (있으면 초대 가입)

**성공 응답 (201)**  
login과 동일 (user, accessToken, refreshToken)

---

### GET /api/auth/me

현재 로그인 사용자 정보 조회.

**요청**
- `Authorization: Bearer {accessToken}` 또는
- `credentials: 'include'` (쿠키의 accessToken 사용)

**성공 응답 (200)**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "nickname": "user",
  "is_admin": "N",
  "is_super_admin": "N"
}
```

---

### POST /api/auth/refresh

accessToken 만료 시 **refreshToken**으로 새 토큰 발급.

**요청**
- 쿠키의 `refreshToken` 자동 전송 (`credentials: 'include'`)
- 또는 body로 전달:
```json
{
  "refreshToken": "eyJhbG..."
}
```

**성공 응답 (200)**
```json
{
  "success": true,
  "message": "토큰이 갱신되었습니다.",
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}
```

- **토큰 회전**: 매번 `accessToken`, `refreshToken` 둘 다 새로 발급
- FE는 반드시 새 `refreshToken`으로 기존 값 교체

---

### POST /api/auth/logout

**요청**: (본문 없음, credentials 포함)

**성공 응답 (200)**
```json
{
  "success": true,
  "message": "로그아웃되었습니다."
}
```

- 쿠키 `accessToken`, `refreshToken` 삭제

---

### PATCH /api/auth/password

비밀번호 변경.

**요청**
```json
{
  "password": "newPassword123"
}
```

- 인증 필요 (accessToken)

---

## 3. FE 구현 예시

### Axios 인스턴스 + 인터셉터

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://your-api.com/api',
  withCredentials: true,  // 쿠키 전송
});

// 응답 인터셉터: 401 시 refresh 시도
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        // 토큰 저장 (로컬스토리지/메모리 등)
        if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshErr) {
        // refresh 실패 → 로그아웃 처리
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// 요청 시 헤더에 accessToken 추가 (선택)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### 로그인 후 토큰 저장

```javascript
const res = await api.post('/auth/login', { email, password });
const { accessToken, refreshToken, user } = res.data;

// 쿠키는 BE가 설정. FE에서 추가로 저장할 경우:
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);
localStorage.setItem('user', JSON.stringify(user));
```

### refresh 호출 (401 전에 주기적으로 호출 가능)

```javascript
// 액세스 토큰 만료 직전(예: 9분마다) 또는 401 수신 시
const { data } = await api.post('/auth/refresh');
// 또는 body로 refreshToken 전달:
// await api.post('/auth/refresh', { refreshToken: localStorage.getItem('refreshToken') });

localStorage.setItem('accessToken', data.accessToken);
localStorage.setItem('refreshToken', data.refreshToken);
```

---

## 4. 에러 코드

| 상태 | 의미 |
|------|------|
| 400 | 이메일/비밀번호 형식 오류, 필수값 누락 |
| 401 | 토큰 없음/만료/유효하지 않음 → refresh 시도 또는 로그인 페이지 이동 |
| 409 | 이메일 중복 (회원가입) |

---

## 5. 주의사항

1. **credentials: 'include'** 또는 **withCredentials: true** 반드시 설정
2. refresh 성공 시 **새 refreshToken**으로 저장 (회전)
3. refresh 실패(401) 시 로그아웃 처리 후 로그인 페이지로 이동
4. accessToken 10분, refreshToken 24시간 기준으로 세션 연장 로직 구성
