-- 만 14세 미만 학부모 동의 기록 (profiles 확장)
-- Supabase SQL Editor 또는 `supabase db push`로 적용.

alter table public.profiles
  add column if not exists is_under_14 boolean,
  add column if not exists parental_consent_at timestamptz,
  add column if not exists parent_phone_last4 text;

comment on column public.profiles.is_under_14 is
  '만 14세 미만 자가 신고(생년월일 아님). Apple 5.1.1(v) 회피용.';
comment on column public.profiles.parental_consent_at is
  '학부모 SMS OTP 동의 완료 시각';
comment on column public.profiles.parent_phone_last4 is
  '학부모 휴대폰 끝 4자리(전체 번호 미저장)';
