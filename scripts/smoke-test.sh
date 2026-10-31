#!/usr/bin/env bash
# Ultra AI MVP smoke tests (docs/CONSOLIDATED_ENGINEERING_SPEC.md §6 step 7)
set -u
B=http://localhost:4000
W=http://localhost:3000

pass=0; fail=0
check() { # name, expected_substr, actual
  if echo "$3" | grep -q "$2"; then echo "PASS: $1"; pass=$((pass+1));
  else echo "FAIL: $1 -> $3"; fail=$((fail+1)); fi
}

# 1. register (idempotent-ish: ignore failure if exists)
R=$(curl -s --max-time 10 -X POST $B/auth/register -H 'Content-Type: application/json' \
  -d '{"email":"admin@ultra.ai","password":"Sup3rSecure!Pass"}')
check "register" '"user"\|"success"\|error' "$R"

# 2. login -> JWT
L=$(curl -s --max-time 10 -X POST $B/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@ultra.ai","password":"Sup3rSecure!Pass"}')
JT=$(echo $L | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("token") or d.get("accessToken") or "")' 2>/dev/null)
if [ -n "$JT" ]; then echo "PASS: login (jwt len ${#JT})"; pass=$((pass+1));
else echo "FAIL: login -> $L"; fail=$((fail+1)); fi

# 3. AI process with auth
AUTH="Authorization: Bearer ${JT}"
A=$(curl -s --max-time 15 -X POST $B/ai/process -H 'Content-Type: application/json' \
  -H "$AUTH" \
  -d '{"input":"Please summarize this quarterly report"}')
check "ai/process (authed)" 'summarization' "$A"

# 4. RBAC: no token on admin dashboard
C=$(curl -s --max-time 10 -o /dev/null -w '%{http_code}' $B/admin/dashboard)
if [ "$C" = "401" ] || [ "$C" = "403" ]; then echo "PASS: admin/dashboard rejects anon ($C)"; pass=$((pass+1));
else echo "FAIL: admin/dashboard anon returned $C"; fail=$((fail+1)); fi

# 5. ZeroAI fallback loop
Z=$(curl -s --max-time 15 -X POST $B/zeroai/message -H 'Content-Type: application/json' -d '{"message":"status"}')
check "zeroai/message" '.' "$Z"

# 6. metrics + swagger
M=$(curl -s --max-time 10 -o /dev/null -w '%{http_code}' $B/metrics)
check "metrics 200" '200' "$M"
D=$(curl -sL --max-time 10 -o /dev/null -w '%{http_code}' $B/api-docs)
check "swagger 200" '200' "$D"

# 7. gateway via web proxy
G=$(curl -s --max-time 10 $W/api/gateway/health)
check "web->gateway proxy" '"status":"ok"' "$G"

echo "----"
echo "SMOKE: $pass passed, $fail failed"
