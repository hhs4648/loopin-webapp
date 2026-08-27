/*
  Apple Sign in with Apple — Supabase에 넣을 client secret(JWT) 생성기.

  외부 서비스에 개인키를 올리지 않고 이 컴퓨터에서만 만든다.
  의존성 없음 (Node 내장 crypto만 사용).

  사용법:
    node gen-apple-secret.mjs <p8파일경로> <KeyID> [TeamID] [ServicesID]
*/
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const [p8Path, keyId, teamId = "T468QG68N9", clientId = "com.haksup.haksupApp.web"] = process.argv.slice(2);

if (!p8Path || !keyId) {
  console.error("사용법: node gen-apple-secret.mjs <p8파일경로> <KeyID> [TeamID] [ServicesID]");
  process.exit(1);
}
if (!fs.existsSync(p8Path)) {
  console.error("파일을 찾을 수 없습니다:", p8Path);
  process.exit(1);
}

const b64url = (buf) =>
  Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const privateKey = crypto.createPrivateKey(fs.readFileSync(p8Path, "utf8"));

const now = Math.floor(Date.now() / 1000);
// 애플 최대 유효기간은 6개월(15777000초). 하루 여유를 둔다.
const exp = now + 15777000 - 86400;

const header = { alg: "ES256", kid: keyId };
const payload = {
  iss: teamId,
  iat: now,
  exp,
  aud: "https://appleid.apple.com",
  sub: clientId,
};

const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
const signature = crypto.sign("sha256", Buffer.from(signingInput), {
  key: privateKey,
  dsaEncoding: "ieee-p1363", // JWS는 DER이 아니라 R||S 형식
});
const jwt = `${signingInput}.${b64url(signature)}`;

const out = path.join(path.dirname(p8Path), "apple-client-secret.txt");
fs.writeFileSync(out, jwt, "utf8");

console.log("생성 완료");
console.log("  저장 위치 :", out);
console.log("  Team ID   :", teamId);
console.log("  Key ID    :", keyId);
console.log("  Client ID :", clientId);
console.log("  만료일    :", new Date(exp * 1000).toISOString().slice(0, 10), "(이날 전에 재발급 필요)");
console.log("  길이      :", jwt.length, "자");
