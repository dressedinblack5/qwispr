# ponytail: single stage, split if image >500MB
FROM node:20-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pip && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir --break-system-packages pennylane
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts || npm install --omit=dev --ignore-scripts
COPY dist ./dist
COPY src/skills/vqe-agent/vqe.py ./dist/src/skills/vqe-agent/vqe.py
COPY src/skills/qaoa-agent/qaoa.py ./dist/src/skills/qaoa-agent/qaoa.py
COPY src/skills/hardware/qpu.py ./dist/src/skills/hardware/qpu.py
COPY README.md ./
ENTRYPOINT ["node", "dist/src/cli.js"]
