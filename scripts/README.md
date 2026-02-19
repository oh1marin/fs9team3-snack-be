# 스크립트

## 한글 커밋 메시지 (commit:ko)

PowerShell에서 `git commit -m "한글"` 시 인코딩 깨짐 방지:

```bash
git add .
yarn commit:ko "feat: 한글 커밋 메시지"
```

또는 메시지를 파일에 UTF-8로 저장 후:

```bash
git commit -F msg.txt
```
