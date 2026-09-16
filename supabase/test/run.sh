#!/bin/bash
# Recreates a scratch database and runs the SQL behaviour tests (needs a local Postgres 15+ on $PGPORT).
set -euo pipefail
cd "$(dirname "$0")"
P="psql -h ${PGHOST:-/tmp} -p ${PGPORT:-55432} -v ON_ERROR_STOP=1 -q -t"
$P -U postgres -c "drop database if exists hm_test" -c "create database hm_test" >/dev/null
$P -U postgres -d hm_test -f supabase-stub.sql >/dev/null 2>&1
$P -U postgres -d hm_test -f ../schema.sql >/dev/null 2>&1
$P -U postgres -d hm_test -f ../schema.sql >/dev/null 2>&1   # idempotent
$P -U postgres -d hm_test -f ../seed.sql >/dev/null
$P -U postgres -d hm_test -f fixtures.sql >/dev/null
$P -U authenticator -d hm_test -f rls-test.sql 2>&1 | grep -E "NOTICE|ERROR" || true
$P -U authenticator -d hm_test -f rls-test-2.sql 2>&1 | grep -E "NOTICE|ERROR" || true
$P -U authenticator -d hm_test -f rls-test-3.sql 2>&1 | grep -E "NOTICE|ERROR" || true
