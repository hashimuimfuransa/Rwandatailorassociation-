# syntax=docker/dockerfile:1

# =============================================================================
# RTA savings platform — single image, two services.
#
# The web app and the background worker run from THE SAME image with different
# start commands (see render.yaml). Building them separately would let the two
# drift onto different commits, and a worker running last week's reconciliation
# logic against this week's schema is the kind of problem that is discovered
# through unexplained balances.
#
# WHY DOCKER RATHER THAN RENDER'S NATIVE NODE ENVIRONMENT: bank statement
# extraction runs scripts/pdf_extract.py through pdfplumber, because
# reconstructing a table from a PDF needs per-character geometry that the
# JavaScript PDF libraries do not expose — without it two adjacent columns can
# fuse into a single wrong amount. A Node-only environment has no interpreter to
# run it. This image carries both runtimes.
# =============================================================================

FROM node:22-slim AS base

# Python for the statement extractor; openssl is required by Prisma's engines.
# Installed in the base layer so the build and runtime stages agree exactly on
# the interpreter that will parse members' statements.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        python3 \
        python3-venv \
        openssl \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# A virtualenv rather than a system-wide pip install: Debian marks its system
# Python as externally managed, so `pip install` into it fails by design.
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv "$VIRTUAL_ENV"
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

COPY scripts/requirements.txt ./scripts/requirements.txt
RUN pip install --no-cache-dir -r scripts/requirements.txt

WORKDIR /app


# --- dependencies ------------------------------------------------------------
FROM base AS deps

COPY package.json package-lock.json ./
# `npm ci` installs devDependencies too. The worker runs its TypeScript through
# tsx at runtime, so they are not strippable here the way they would be for a
# pure web deployment.
RUN npm ci


# --- build -------------------------------------------------------------------
FROM base AS build

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generates the Prisma client into lib/generated/prisma, then builds Next.
# NEXT_TELEMETRY_DISABLED keeps the build from phoning home.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build


# --- runtime -----------------------------------------------------------------
FROM base AS runtime

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# The extractor is invoked as a subprocess by lib/services/pdf-extract.ts and
# must be the virtualenv interpreter, not the bare system one — that is where
# pdfplumber lives.
ENV PYTHON_BIN=/opt/venv/bin/python
# Fail loudly if the extractor is unavailable rather than silently falling back
# to the weaker JavaScript parser. A downgrade that nobody notices is how a
# misread amount reaches a member's balance.
ENV STATEMENT_EXTRACTOR=python

# `--chown` on every copy: the app runs unprivileged, and Next writes its cache
# under .next at runtime. Fixing ownership afterwards with a recursive chown
# would duplicate the whole tree into another image layer.
#
# The standalone bundle first: it provides server.js and the minimal traced
# node_modules. `next start` is NOT usable with output:"standalone" — Next
# refuses it explicitly — so the web service runs server.js directly.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static     ./.next/static
COPY --from=build --chown=node:node /app/public           ./public

# The full dependency tree, layered OVER the pruned one the standalone bundle
# brought with it. Tracing strips devDependencies, but the worker runs its
# TypeScript through tsx at runtime and needs them. A superset is safe for the
# web server, which only ever reaches for what it traced.
COPY --from=deps --chown=node:node /app/node_modules ./node_modules

# Application source. The worker executes its TypeScript directly through tsx,
# and pdf-extract.ts resolves scripts/pdf_extract.py from the working directory
# at runtime — so this is not a build artefact that can be dropped.
#
# `lib` carries the generated Prisma client with it: it is produced by
# `prisma generate` during the build stage into lib/generated, which is why
# .dockerignore excludes that directory from the build context.
COPY --from=build --chown=node:node /app/package.json          ./package.json
COPY --from=build --chown=node:node /app/next.config.ts        ./next.config.ts
COPY --from=build --chown=node:node /app/tsconfig.json         ./tsconfig.json
COPY --from=build --chown=node:node /app/tsconfig.scripts.json ./tsconfig.scripts.json
COPY --from=build --chown=node:node /app/prisma.config.ts      ./prisma.config.ts
COPY --from=build --chown=node:node /app/prisma                ./prisma
COPY --from=build --chown=node:node /app/scripts               ./scripts
COPY --from=build --chown=node:node /app/worker                ./worker
COPY --from=build --chown=node:node /app/lib                   ./lib
COPY --from=build --chown=node:node /app/app                   ./app
COPY --from=build --chown=node:node /app/components            ./components
COPY --from=build --chown=node:node /app/middleware.ts         ./middleware.ts

# Drop privileges. `node` is created by the base image.
USER node

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# The standalone server, not `next start`. Overridden by the worker service
# with `npm run worker`. See render.yaml.
CMD ["node", "server.js"]
