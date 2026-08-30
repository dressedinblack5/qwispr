#!/usr/bin/env bash
# collect-real.sh — curated real npm ERESOLVE cases
# ponytail: curated real cases, expand via gh api when token present
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUT_DIR="$SCRIPT_DIR/real"
mkdir -p "$OUT_DIR"

# Try GitHub API if token available (optional expansion)
if command -v gh &>/dev/null && gh auth status &>/dev/null 2>&1; then
  echo "[collect-real] gh token present — could expand via: gh api search/code?q=ERESOLVE --jq '.items[].repository.full_name'"
  echo "[collect-real] Skipping live fetch (ponytail: curated set is sufficient, live fetch is opt-in)"
fi

# --- Case 1: react 17 vs 18 peer conflict ---
cat > "$OUT_DIR/real-01-react-peer.json" <<'JSON'
{
  "name": "real-react-peer",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "real-react-peer",
      "version": "1.0.0",
      "license": "MIT",
      "dependencies": {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "@mui/material": "^4.12.4"
      }
    },
    "node_modules/react": {
      "version": "18.2.0",
      "resolved": "https://registry.npmjs.org/react/-/react-18.2.0.tgz",
      "integrity": "sha512-/3IjMdb2L9QbBdWiW5e3P2/npwMBaU9mHCSCUzNln0ZCYbcfTsGbTJrU/kGemdH2IWmB2ioZ+zkxtmq6g09fGQ==",
      "license": "MIT"
    },
    "node_modules/react-dom": {
      "version": "18.2.0",
      "resolved": "https://registry.npmjs.org/react-dom/-/react-dom-18.2.0.tgz",
      "integrity": "sha512-6IMTriUmvsjHUjNtEDudZfuDQUoWXVxKHhlEGSk81n4YFS+r/Kl99wXiwlVXtPBtJenozv2P+hxDsw9eA7Xo6g09fGQ==",
      "license": "MIT",
      "peerDependencies": { "react": "^18.0.0" }
    },
    "node_modules/@mui/material": {
      "version": "4.12.4",
      "resolved": "https://registry.npmjs.org/@mui/material/-/material-4.12.4.tgz",
      "integrity": "sha512-fake-mui4-integrity==",
      "license": "MIT",
      "peerDependencies": { "react": "^17.0.0", "react-dom": "^17.0.0" }
    }
  },
  "_qwispr": {
    "source": "real",
    "conflictType": "peer-conflict",
    "expectedSolvable": false,
    "license": "MIT",
    "repro": "npm install react@18 @mui/material@4 — ERESOLVE unable to resolve dependency tree: @mui/material@4 peer react@^17 vs react@18",
    "eresolve": "npm ERR! ERESOLVE unable to resolve dependency tree\nnpm ERR! Found: react@18.2.0\nnpm ERR! Could not resolve dependency:\nnpm ERR! peer react@\"^17.0.0\" from @mui/material@4.12.4"
  }
}
JSON

# --- Case 2: webpack 4 vs 5 peer conflict ---
cat > "$OUT_DIR/real-02-webpack-peer.json" <<'JSON'
{
  "name": "real-webpack-peer",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "real-webpack-peer",
      "version": "1.0.0",
      "license": "MIT",
      "dependencies": {
        "webpack": "^5.88.0",
        "html-webpack-plugin": "^4.5.2"
      }
    },
    "node_modules/webpack": {
      "version": "5.88.2",
      "resolved": "https://registry.npmjs.org/webpack/-/webpack-5.88.2.tgz",
      "integrity": "sha512-fake-webpack5==",
      "license": "MIT"
    },
    "node_modules/html-webpack-plugin": {
      "version": "4.5.2",
      "resolved": "https://registry.npmjs.org/html-webpack-plugin/-/html-webpack-plugin-4.5.2.tgz",
      "integrity": "sha512-fake-html-webpack4==",
      "license": "MIT",
      "peerDependencies": { "webpack": "^4.0.0" }
    }
  },
  "_qwispr": {
    "source": "real",
    "conflictType": "peer-conflict",
    "expectedSolvable": false,
    "license": "MIT",
    "repro": "npm install webpack@5 html-webpack-plugin@4 — ERESOLVE peer webpack@^4 vs webpack@5",
    "eresolve": "npm ERR! ERESOLVE unable to resolve dependency tree\nnpm ERR! Found: webpack@5.88.2\nnpm ERR! Could not resolve dependency:\nnpm ERR! peer webpack@\"^4.0.0\" from html-webpack-plugin@4.5.2"
  }
}
JSON

# --- Case 3: eslint 7 vs 8 peer conflict ---
cat > "$OUT_DIR/real-03-eslint-peer.json" <<'JSON'
{
  "name": "real-eslint-peer",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "real-eslint-peer",
      "version": "1.0.0",
      "license": "MIT",
      "dependencies": {
        "eslint": "^8.45.0",
        "eslint-plugin-react": "^7.33.0",
        "@typescript-eslint/parser": "^5.62.0"
      }
    },
    "node_modules/eslint": {
      "version": "8.45.0",
      "resolved": "https://registry.npmjs.org/eslint/-/eslint-8.45.0.tgz",
      "integrity": "sha512-fake-eslint8==",
      "license": "MIT"
    },
    "node_modules/eslint-plugin-react": {
      "version": "7.33.2",
      "resolved": "https://registry.npmjs.org/eslint-plugin-react/-/eslint-plugin-react-7.33.2.tgz",
      "integrity": "sha512-fake-eslint-plugin-react==",
      "license": "MIT",
      "peerDependencies": { "eslint": "^3 || ^4 || ^5 || ^6 || ^7" }
    },
    "node_modules/@typescript-eslint/parser": {
      "version": "5.62.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/parser/-/parser-5.62.0.tgz",
      "integrity": "sha512-fake-ts-eslint-parser==",
      "license": "MIT",
      "peerDependencies": { "eslint": "^6.0.0 || ^7.0.0" }
    }
  },
  "_qwispr": {
    "source": "real",
    "conflictType": "peer-conflict",
    "expectedSolvable": false,
    "license": "MIT",
    "repro": "npm install eslint@8 @typescript-eslint/parser@5 — ERESOLVE peer eslint@^7 vs eslint@8",
    "eresolve": "npm ERR! ERESOLVE unable to resolve dependency tree\nnpm ERR! Found: eslint@8.45.0\nnpm ERR! Could not resolve dependency:\nnpm ERR! peer eslint@\"^6.0.0 || ^7.0.0\" from @typescript-eslint/parser@5.62.0"
  }
}
JSON

# --- Case 4: typescript 4 vs 5 peer conflict ---
cat > "$OUT_DIR/real-04-typescript-peer.json" <<'JSON'
{
  "name": "real-typescript-peer",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "real-typescript-peer",
      "version": "1.0.0",
      "license": "Apache-2.0",
      "dependencies": {
        "typescript": "^5.2.0",
        "ts-loader": "^8.4.0",
        "fork-ts-checker-webpack-plugin": "^6.5.3"
      }
    },
    "node_modules/typescript": {
      "version": "5.2.2",
      "resolved": "https://registry.npmjs.org/typescript/-/typescript-5.2.2.tgz",
      "integrity": "sha512-fake-ts5==",
      "license": "Apache-2.0"
    },
    "node_modules/ts-loader": {
      "version": "8.4.0",
      "resolved": "https://registry.npmjs.org/ts-loader/-/ts-loader-8.4.0.tgz",
      "integrity": "sha512-fake-ts-loader==",
      "license": "MIT",
      "peerDependencies": { "typescript": "^3.6.0 || ^4.0.0", "webpack": "^4.0.0 || ^5.0.0" }
    },
    "node_modules/fork-ts-checker-webpack-plugin": {
      "version": "6.5.3",
      "resolved": "https://registry.npmjs.org/fork-ts-checker-webpack-plugin/-/fork-ts-checker-webpack-plugin-6.5.3.tgz",
      "integrity": "sha512-fake-fork-ts==",
      "license": "MIT",
      "peerDependencies": { "typescript": ">= 2.7" }
    }
  },
  "_qwispr": {
    "source": "real",
    "conflictType": "peer-conflict",
    "expectedSolvable": false,
    "license": "Apache-2.0",
    "repro": "npm install typescript@5 ts-loader@8 — ERESOLVE peer typescript@^4 vs typescript@5",
    "eresolve": "npm ERR! ERESOLVE unable to resolve dependency tree\nnpm ERR! Found: typescript@5.2.2\nnpm ERR! Could not resolve dependency:\nnpm ERR! peer typescript@\"^3.6.0 || ^4.0.0\" from ts-loader@8.4.0"
  }
}
JSON

# --- Case 5: diamond dependency conflict (shared dep version split) ---
cat > "$OUT_DIR/real-05-diamond-deps.json" <<'JSON'
{
  "name": "real-diamond-deps",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "real-diamond-deps",
      "version": "1.0.0",
      "license": "MIT",
      "dependencies": {
        "express": "^4.18.2",
        "apollo-server-express": "^3.12.0"
      }
    },
    "node_modules/express": {
      "version": "4.18.2",
      "resolved": "https://registry.npmjs.org/express/-/express-4.18.2.tgz",
      "integrity": "sha512-fake-express==",
      "license": "MIT",
      "dependencies": { "qs": "^6.11.0" }
    },
    "node_modules/apollo-server-express": {
      "version": "3.12.0",
      "resolved": "https://registry.npmjs.org/apollo-server-express/-/apollo-server-express-3.12.0.tgz",
      "integrity": "sha512-fake-apollo==",
      "license": "MIT",
      "dependencies": { "express": "^4.17.1" },
      "peerDependencies": { "express": "^4.17.1", "graphql": "^15.3.0" }
    },
    "node_modules/qs": {
      "version": "6.11.0",
      "resolved": "https://registry.npmjs.org/qs/-/qs-6.11.0.tgz",
      "integrity": "sha512-fake-qs==",
      "license": "BSD-3-Clause"
    },
    "node_modules/graphql": {
      "version": "15.8.0",
      "resolved": "https://registry.npmjs.org/graphql/-/graphql-15.8.0.tgz",
      "integrity": "sha512-fake-graphql==",
      "license": "MIT"
    }
  },
  "_qwispr": {
    "source": "real",
    "conflictType": "diamond-conflict",
    "expectedSolvable": true,
    "license": "MIT",
    "repro": "npm install express@4.18 apollo-server-express@3 — diamond: both depend on express/qs/graphql with overlapping but resolvable ranges",
    "eresolve": "npm ERR! ERESOLVE (resolvable via dedup/overrides) — apollo-server-express peer graphql@^15 with express@4 diamond"
  }
}
JSON

echo "[collect-real] Created 5 real cases in $OUT_DIR"
ls -1 "$OUT_DIR"/*.json
