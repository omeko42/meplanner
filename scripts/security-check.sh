#!/usr/bin/env bash
# =============================================================================
# MEPlanner — Security regression checks
#
# Boots the built app and asserts that every protected endpoint refuses
# unauthenticated access, and that the payment guard rejects forged amounts.
#
# Usage:  bash scripts/security-check.sh [port]
# =============================================================================
set -uo pipefail

PORT="${1:-3199}"
BASE="http://localhost:${PORT}"
PASS=0
FAIL=0

ok()   { printf '  \033[32mPASS\033[0m  %s\n' "$1"; PASS=$((PASS+1)); }
bad()  { printf '  \033[31mFAIL\033[0m  %s\n' "$1"; FAIL=$((FAIL+1)); }

# expect_code <label> <expected> <curl args...>
expect_code() {
  local label="$1"; local expected="$2"; shift 2
  local actual
  actual=$(curl -s -o /dev/null -w '%{http_code}' "$@")
  if [ "$actual" = "$expected" ]; then
    ok "$label (HTTP $actual)"
  else
    bad "$label — expected HTTP $expected, got $actual"
  fi
}

# expect_body <label> <needle> <curl args...>
expect_body() {
  local label="$1"; local needle="$2"; shift 2
  local body
  body=$(curl -s "$@")
  if printf '%s' "$body" | grep -qi -- "$needle"; then
    ok "$label"
  else
    bad "$label — response did not contain '$needle': ${body:0:160}"
  fi
}

echo ""
echo "MEPlanner security regression checks"
echo "===================================="

echo ""
echo "[1] Unauthenticated API access must be refused"
expect_code "GET  /api/wedding"                 401 "$BASE/api/wedding"
expect_code "GET  /api/supabase-sync"           401 "$BASE/api/supabase-sync"
expect_code "POST /api/supabase-sync"           401 -X POST -H 'Content-Type: application/json' -d '{"data":{"settings":{}}}' "$BASE/api/supabase-sync"
expect_code "GET  /api/db"                      401 "$BASE/api/db?table=wedding_users"
expect_code "GET  /api/db (credentials table)"  401 "$BASE/api/db?table=app_user_credentials"
expect_code "GET  /api/media"                   401 "$BASE/api/media?root=photos"
expect_code "GET  /api/state-version"           401 "$BASE/api/state-version"
expect_code "GET  /api/auth"                    401 "$BASE/api/auth"

echo ""
echo "[2] Credential vault must not be reachable through the proxy"
expect_code "POST /api/db (credentials table)"  401 -X POST -H 'Content-Type: application/json' -d '{"rows":[]}' "$BASE/api/db?table=app_user_credentials"

echo ""
echo "[3] Legacy registration bypass must be gone"
expect_body "REGISTER_GMAIL_WORKSPACE rejected" "LEGACY_REGISTER_DISABLED" \
  -X POST -H 'Content-Type: application/json' \
  -d '{"action":"REGISTER_GMAIL_WORKSPACE","user":{"email":"attacker@evil.com","clientId":"c","nama":"H"}}' \
  "$BASE/api/auth"

echo ""
echo "[4] Verification links must be validated server-side"
expect_code "GET  /api/auth/verify (no token)"   400 "$BASE/api/auth/verify"
expect_code "GET  /api/auth/verify (bad token)"  400 "$BASE/api/auth/verify?token=deadbeef&email=a@b.com"

echo ""
echo "[5] Registration must validate its input"
expect_body "REGISTER_WORKSPACE rejects bad email" "INVALID_EMAIL" \
  -X POST -H 'Content-Type: application/json' \
  -d '{"action":"REGISTER_WORKSPACE","email":"not-an-email"}' \
  "$BASE/api/auth"

echo ""
echo "[6] Payment amounts must come from the server catalogue"
expect_body "Unknown package rejected"    "Paket tidak dikenal" \
  -X POST -H 'Content-Type: application/json' \
  -d '{"orderId":"T1","idempotencyKey":"K1","category":"CRYPTO","network":"TRC20","txHashOrRef":"abc123def","packageId":"HACKED","expectedAmount":1}' \
  "$BASE/api/payment/verify"
expect_body "Forged amount rejected"     "katalog paket resmi" \
  -X POST -H 'Content-Type: application/json' \
  -d '{"orderId":"T2","idempotencyKey":"K2","category":"CRYPTO","network":"TRC20","txHashOrRef":"abc123def","packageId":"MITRA_GOLD","expectedAmount":1}' \
  "$BASE/api/payment/verify"
expect_body "Missing packageId rejected"  "Paket tidak dikenal" \
  -X POST -H 'Content-Type: application/json' \
  -d '{"orderId":"T3","idempotencyKey":"K3","category":"CRYPTO","network":"TRC20","txHashOrRef":"abc123def","expectedAmount":1}' \
  "$BASE/api/payment/verify"

echo ""
echo "[7] Security headers must be present"
HDRS=$(curl -s -D - -o /dev/null "$BASE/")
for h in "content-security-policy" "strict-transport-security" "x-frame-options" "x-content-type-options" "referrer-policy"; do
  if printf '%s' "$HDRS" | grep -qi "^$h:"; then
    ok "header $h present"
  else
    bad "header $h missing"
  fi
done

echo ""
echo "[8] Public pages must still be reachable"
expect_code "GET  /"              200 "$BASE/"
expect_code "GET  /auth/verify"   200 "$BASE/auth/verify"
# /admin redirects into the single-page app; 307 is the expected answer.
expect_code "GET  /admin"         307 "$BASE/admin"

echo ""
echo "===================================="
printf 'Passed: %d   Failed: %d\n' "$PASS" "$FAIL"
echo ""

[ "$FAIL" -eq 0 ] || exit 1
