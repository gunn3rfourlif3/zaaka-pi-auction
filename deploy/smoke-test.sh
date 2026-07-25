#!/usr/bin/env bash
# ============================================================================
# Pi Auctions — post-deploy smoke test
# ----------------------------------------------------------------------------
# Verifies the app is up and that the Phase 0–2 security controls are actually
# enforced on a running instance. Safe to run against staging or production —
# it only performs reads and UNauthenticated writes (which must be rejected).
#
#   Usage:  ./deploy/smoke-test.sh [BASE_URL]
#   e.g.    ./deploy/smoke-test.sh http://127.0.0.1:3000
#           ./deploy/smoke-test.sh https://auction.example.com
# ============================================================================
set -uo pipefail

BASE_URL="${1:-http://127.0.0.1:3000}"
PASS=0
FAIL=0

# status_of METHOD PATH [DATA]
status_of() {
  local method="$1" path="$2" data="${3:-}"
  if [[ -n "$data" ]]; then
    curl -s -o /dev/null -w '%{http_code}' -X "$method" \
      -H 'Content-Type: application/json' -d "$data" "$BASE_URL$path"
  else
    curl -s -o /dev/null -w '%{http_code}' -X "$method" "$BASE_URL$path"
  fi
}

# check "label" EXPECTED ACTUAL
check() {
  local label="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    echo "  ✅ $label — got $actual"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $label — expected $expected, got $actual"
    FAIL=$((FAIL + 1))
  fi
}

# check_in "label" ACTUAL EXPECTED1 EXPECTED2 ...
check_in() {
  local label="$1" actual="$2"; shift 2
  for e in "$@"; do
    if [[ "$actual" == "$e" ]]; then echo "  ✅ $label — got $actual"; PASS=$((PASS + 1)); return; fi
  done
  echo "  ❌ $label — expected one of [$*], got $actual"; FAIL=$((FAIL + 1))
}

echo "▶ Smoke testing $BASE_URL"
echo

echo "Liveness & public reads:"
check "health endpoint"            "200" "$(status_of GET /api/health)"
check_in "live auctions readable"  "$(status_of GET /api/auctions/live)" "200" "304"
echo

echo "Auth is enforced on protected writes (must be rejected when unauthenticated):"
check "create auction -> 401"      "401" "$(status_of POST /api/auctions/create '{"title":"x","price":1,"expiresAt":"2099-01-01"}')"
check "send message -> 401"        "401" "$(status_of POST /api/messages/send '{"receiverId":"a","auctionId":1,"content":"hi"}')"
check "settle (admin) -> 401"      "401" "$(status_of POST /api/auctions/settle '{"auctionId":1}')"
check "complete real bid -> 401"   "401" "$(status_of POST /api/payments/complete '{"paymentId":"real_123","txid":"t"}')"
check "approve real bid -> 401"    "401" "$(status_of POST /api/payments/approve '{"paymentId":"real_123"}')"
echo

echo "Cron settlement requires the shared secret:"
check "cron without secret -> 401" "401" "$(status_of POST /api/cron/settle-expired)"
echo

echo "Mock-payment bypass (production only — informational):"
mock_status="$(status_of POST /api/payments/approve '{"paymentId":"pay_mock_1","auctionId":1}')"
echo "  ℹ️  approve pay_mock_ returned $mock_status (expect 400 in production; 200/400 in dev)"
echo

echo "──────────────────────────────────────────"
echo "Passed: $PASS   Failed: $FAIL"
if [[ "$FAIL" -gt 0 ]]; then
  echo "✖ Smoke test FAILED"
  exit 1
fi
echo "✅ Smoke test passed"
