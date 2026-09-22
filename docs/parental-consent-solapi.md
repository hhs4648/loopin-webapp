# 학부모 SMS 동의 (Solapi) 배포

만 14세 미만 온보딩용. 클라이언트에는 Solapi 키를 **넣지 않는다**.

## 1. Solapi

1. [solapi.com](https://solapi.com) 가입·충전
2. 발신번호 등록·승인
3. API Key / API Secret 발급

## 2. Supabase secrets

```bash
supabase secrets set SOLAPI_API_KEY=... SOLAPI_API_SECRET=... SOLAPI_SENDER=010xxxxxxxx
supabase secrets set PARENTAL_CONSENT_HMAC_SECRET=$(openssl rand -hex 32)
```

로컬/스테이징에서 문자 없이 테스트:

```bash
supabase secrets set PARENTAL_CONSENT_DEV_MODE=true
# Solapi 키가 없으면 인증번호 고정 123456 (응답에 devCode)
```

## 3. 함수·SQL

```bash
supabase functions deploy parental-consent-otp
# SQL Editor에서 migrations/20260922_parental_consent_profile.sql 실행
```

## 4. 앱 플로우

`약관 → 만 14세? → (미만) 보호자 번호+OTP+동의 → 학년`

심사자는 「만 14세 이상」을 고르면 SMS 없이 통과한다.
