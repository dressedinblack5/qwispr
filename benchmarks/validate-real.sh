#!/usr/bin/env bash
# validate-real.sh — verify real benchmark cases
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REAL_DIR="$SCRIPT_DIR/real"
FAIL=0
PASS=0
for f in "$REAL_DIR"/*.json; do
  [ -e "$f" ] || { echo "No files in $REAL_DIR"; exit 1; }
  name=$(basename "$f")
  # valid JSON
  if ! node -e "JSON.parse(require('fs').readFileSync('$f','utf8'))" 2>/dev/null; then
    echo "FAIL $name: invalid JSON"; FAIL=$((FAIL+1)); continue
  fi
  # has _qwispr.expectedSolvable and source:real
  ok=$(node -e "
    const j=JSON.parse(require('fs').readFileSync('$f','utf8'));
    const q=j._qwispr||{};
    const valid = typeof q.expectedSolvable==='boolean' && q.source==='real' && j.packages && j.lockfileVersion;
    console.log(valid?'ok':'bad');
  ")
  if [ "$ok" != "ok" ]; then
    echo "FAIL $name: missing _qwispr.expectedSolvable/source or packages"; FAIL=$((FAIL+1)); continue
  fi
  # license check
  lic=$(node -e "console.log((JSON.parse(require('fs').readFileSync('$f','utf8'))._qwispr||{}).license||'')")
  case "$lic" in MIT|Apache-2.0|BSD-3-Clause|ISC) ;; *) echo "FAIL $name: license $lic not allowed"; FAIL=$((FAIL+1)); continue;; esac
  echo "PASS $name (solvable=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$f','utf8'))._qwispr.expectedSolvable)"), license=$lic)"
  PASS=$((PASS+1))
done
echo "--- $PASS passed, $FAIL failed ---"
[ "$FAIL" -eq 0 ]
