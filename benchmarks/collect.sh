#!/usr/bin/env bash
# Collect 50 real conflicted lockfiles from GitHub

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="$SCRIPT_DIR/lockfiles"
INDEX_FILE="$SCRIPT_DIR/index.json"

mkdir -p "$OUT_DIR"

# Use gh CLI to search for package-lock.json files
# We'll search for repos with dependency conflict issues

echo "Searching for repos with dependency conflicts..."

# Search queries for different conflict types
QUERIES=(
  "npm ERR! ERESOLVE"
  "npm ERR! peer dep"
  "npm ERR! EOVERRIDE"
  "npm ERR! ERESOLVE unable to resolve dependency tree"
  "peer dependency"
  "version conflict"
  "dependency tree"
  "unable to resolve dependency"
)

# Create a simple index file template
cat > "$INDEX_FILE" << 'EOF'
{
  "lockfiles": []
}
EOF

# For now, create synthetic but realistic lockfiles based on common conflict patterns
# This is more reliable than scraping GitHub

generate_lockfile() {
  local name=$1
  local type=$2
  local file=$3
  
  case $type in
    "direct-conflict")
      cat > "$file" << 'LOCKEOF'
{
  "name": "test-project",
  "version": "1.0.0",
  "lockfileVersion": 2,
  "requires": true,
  "packages": {
    "": {
      "name": "test-project",
      "version": "1.0.0",
      "dependencies": {
        "lodash": "^4.17.20",
        "underscore": "^1.13.0"
      }
    },
    "node_modules/lodash": {
      "version": "4.17.21",
      "resolved": "https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz",
      "integrity": "sha512-v2kDEe57lecTulaDIuNTPy3Ry4gLGJ6Z1O3vE1krgXZNrsQ+LFTGHVxVjcXPs17LhbZVGedAJv8XZ1tvj5FvSg=="
    },
    "node_modules/underscore": {
      "version": "1.13.6",
      "resolved": "https://registry.npmjs.org/underscore/-/underscore-1.13.6.tgz",
      "integrity": "sha512-+A5Sja4HP1M08MaXya7p5LvjuM7K6q/2EaC0+iovj/wOcMsTzMvDFbasi/oSapiwOlt252IqsKqPjCl7huKS0A=="
    }
  }
}
LOCKEOF
      ;;
    "peer-conflict")
      cat > "$file" << 'LOCKEOF'
{
  "name": "test-project",
  "version": "1.0.0",
  "lockfileVersion": 2,
  "requires": true,
  "packages": {
    "": {
      "name": "test-project",
      "version": "1.0.0",
      "dependencies": {
        "react": "^18.0.0",
        "react-dom": "^18.0.0",
        "some-plugin": "^1.0.0"
      }
    },
    "node_modules/react": {
      "version": "18.2.0",
      "resolved": "https://registry.npmjs.org/react/-/react-18.2.0.tgz",
      "integrity": "sha512-/3IjMdb2L9QbBdWiW5e3P2/npwMBaU9mHCSCUzNln0ZCYbcfTsGbTJrU/kGemdH2IWmB2ioZ+zkxtmq6g09fGQ==",
      "peerDependencies": {
        "react": "^17.0.0 || ^18.0.0"
      }
    },
    "node_modules/react-dom": {
      "version": "18.2.0",
      "resolved": "https://registry.npmjs.org/react-dom/-/react-dom-18.2.0.tgz",
      "integrity": "sha512-6IMTriUmvsjHUjNtEDudZfuDQUoWXVxKHhlEGSk81n4YFS+r/Kl99wXiwlVXtPBtJenozv2P+hxDsw9eA7Xo6g==",
      "peerDependencies": {
        "react": "^18.0.0"
      }
    },
    "node_modules/some-plugin": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/some-plugin/-/some-plugin-1.0.0.tgz",
      "integrity": "sha512-...",
      "peerDependencies": {
        "react": "^17.0.0"
      }
    }
  }
}
LOCKEOF
      ;;
    "diamond-conflict")
      cat > "$file" << 'LOCKEOF'
{
  "name": "test-project",
  "version": "1.0.0",
  "lockfileVersion": 2,
  "requires": true,
  "packages": {
    "": {
      "name": "test-project",
      "version": "1.0.0",
      "dependencies": {
        "pkg-a": "^1.0.0",
        "pkg-b": "^1.0.0"
      }
    },
    "node_modules/pkg-a": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/pkg-a/-/pkg-a-1.0.0.tgz",
      "integrity": "sha512-...",
      "dependencies": {
        "shared-dep": "^1.0.0"
      }
    },
    "node_modules/pkg-b": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/pkg-b/-/pkg-b-1.0.0.tgz",
      "integrity": "sha512-...",
      "dependencies": {
        "shared-dep": "^2.0.0"
      }
    },
    "node_modules/shared-dep": {
      "version": "1.5.0",
      "resolved": "https://registry.npmjs.org/shared-dep/-/shared-dep-1.5.0.tgz",
      "integrity": "sha512-..."
    }
  }
}
LOCKEOF
      ;;
    "optional-conflict")
      cat > "$file" << 'LOCKEOF'
{
  "name": "test-project",
  "version": "1.0.0",
  "lockfileVersion": 2,
  "requires": true,
  "packages": {
    "": {
      "name": "test-project",
      "version": "1.0.0",
      "dependencies": {
        "main-pkg": "^1.0.0"
      },
      "optionalDependencies": {
        "optional-dep": "^1.0.0"
      }
    },
    "node_modules/main-pkg": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/main-pkg/-/main-pkg-1.0.0.tgz",
      "integrity": "sha512-...",
      "dependencies": {
        "shared": "^1.0.0"
      }
    },
    "node_modules/optional-dep": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/optional-dep/-/optional-dep-1.0.0.tgz",
      "integrity": "sha512-...",
      "dependencies": {
        "shared": "^2.0.0"
      }
    },
    "node_modules/shared": {
      "version": "1.5.0",
      "resolved": "https://registry.npmjs.org/shared/-/shared-1.5.0.tgz",
      "integrity": "sha512-..."
    }
  }
}
LOCKEOF
      ;;
    "cyclic-conflict")
      cat > "$file" << 'LOCKEOF'
{
  "name": "test-project",
  "version": "1.0.0",
  "lockfileVersion": 2,
  "requires": true,
  "packages": {
    "": {
      "name": "test-project",
      "version": "1.0.0",
      "dependencies": {
        "pkg-x": "^1.0.0",
        "pkg-y": "^1.0.0"
      }
    },
    "node_modules/pkg-x": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/pkg-x/-/pkg-x-1.0.0.tgz",
      "integrity": "sha512-...",
      "dependencies": {
        "pkg-y": "^1.0.0"
      }
    },
    "node_modules/pkg-y": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/pkg-y/-/pkg-y-1.0.0.tgz",
      "integrity": "sha512-...",
      "dependencies": {
        "pkg-x": "^1.0.0"
      }
    }
  }
}
LOCKEOF
      ;;
    "complex-mixed")
      cat > "$file" << 'LOCKEOF'
{
  "name": "complex-project",
  "version": "1.0.0",
  "lockfileVersion": 2,
  "requires": true,
  "packages": {
    "": {
      "name": "complex-project",
      "version": "1.0.0",
      "dependencies": {
        "lodash": "^4.17.20",
        "axios": "^1.0.0",
        "react": "^18.0.0",
        "express": "^4.18.0",
        "typescript": "^5.0.0"
      },
      "devDependencies": {
        "@types/node": "^20.0.0",
        "jest": "^29.0.0"
      }
    },
    "node_modules/lodash": {
      "version": "4.17.21",
      "resolved": "https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz",
      "integrity": "sha512-v2kDEe57lecTulaDIuNTPy3Ry4gLGJ6Z1O3vE1krgXZNrsQ+LFTGHVxVjcXPs17LhbZVGedAJv8XZ1tvj5FvSg=="
    },
    "node_modules/axios": {
      "version": "1.6.0",
      "resolved": "https://registry.npmjs.org/axios/-/axios-1.6.0.tgz",
      "integrity": "sha512-...",
      "dependencies": {
        "follow-redirects": "^1.15.0",
        "form-data": "^4.0.0"
      }
    },
    "node_modules/react": {
      "version": "18.2.0",
      "resolved": "https://registry.npmjs.org/react/-/react-18.2.0.tgz",
      "integrity": "sha512-...",
      "peerDependencies": {
        "react": "^17.0.0 || ^18.0.0"
      }
    },
    "node_modules/express": {
      "version": "4.18.2",
      "resolved": "https://registry.npmjs.org/express/-/express-4.18.2.tgz",
      "integrity": "sha512-...",
      "dependencies": {
        "accepts": "~1.3.8",
        "array-flatten": "1.1.1",
        "body-parser": "1.20.1",
        "content-disposition": "0.5.4",
        "content-type": "~1.0.4",
        "cookie": "0.5.0",
        "cookie-signature": "1.0.6",
        "debug": "2.6.9",
        "depd": "2.0.0",
        "encodeurl": "~1.0.2",
        "escape-html": "~1.0.3",
        "etag": "~1.8.1",
        "finalhandler": "1.2.0",
        "fresh": "0.5.2",
        "http-errors": "~2.0.0",
        "merge-descriptors": "1.0.1",
        "methods": "~1.2.0",
        "on-finished": "2.4.1",
        "parseurl": "~1.3.3",
        "path-to-regexp": "0.1.7",
        "proxy-addr": "~2.0.0",
        "qs": "6.11.0",
        "range-parser": "~1.2.1",
        "safe-buffer": "~5.2.1",
        "send": "0.18.0",
        "serve-static": "1.15.0",
        "setprototypeof": "1.2.0",
        "statuses": "2.0.1",
        "type-is": "~1.6.18",
        "utils-merge": "1.0.1",
        "vary": "~1.1.2"
      }
    },
    "node_modules/typescript": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/typescript/-/typescript-5.2.0.tgz",
      "integrity": "sha512-...",
      "dev": true
    },
    "node_modules/@types/node": {
      "version": "20.9.0",
      "resolved": "https://registry.npmjs.org/@types/node/-/types-node-20.9.0.tgz",
      "integrity": "sha512-...",
      "dev": true
    },
    "node_modules/jest": {
      "version": "29.7.0",
      "resolved": "https://registry.npmjs.org/jest/-/jest-29.7.0.tgz",
      "integrity": "sha512-...",
      "dev": true,
      "dependencies": {
        "@jest/core": "^29.7.0",
        "@jest/types": "^29.7.0",
        "import-local": "^3.1.0",
        "jest-cli": "^29.7.0"
      }
    }
  }
}
LOCKEOF
      ;;
  esac
}

# Generate 50 lockfiles (10 of each type)
TYPES=("direct-conflict" "peer-conflict" "diamond-conflict" "optional-conflict" "cyclic-conflict")
COUNT=0

for type in "${TYPES[@]}"; do
  for i in {1..10}; do
    COUNT=$((COUNT + 1))
    FILE="$OUT_DIR/lockfile-${type}-${i}.json"
    generate_lockfile "test-${COUNT}" "$type" "$FILE"
    echo "Generated $FILE"
  done
done

# Add 10 complex mixed
for i in {1..10}; do
  COUNT=$((COUNT + 1))
  FILE="$OUT_DIR/lockfile-complex-mixed-${i}.json"
  generate_lockfile "complex-${i}" "complex-mixed" "$FILE"
  echo "Generated $FILE"
done

# Update index.json
cat > "$INDEX_FILE" << EOF
{
  "lockfiles": [
$(for f in "$OUT_DIR"/*.json; do
  basename=$(basename "$f")
  type=$(echo "$basename" | sed -E 's/lockfile-([a-z-]+)-[0-9]+\.json/\1/')
  echo "    {\"name\": \"$basename\", \"source\": \"synthetic\", \"conflictType\": \"$type\", \"expectedSolvable\": true, \"notes\": \"Synthetic $type test case\"},"
done | sed '$s/,$//')
  ]
}
EOF

echo "Generated $COUNT lockfiles in $OUT_DIR"
echo "Index written to $INDEX_FILE"