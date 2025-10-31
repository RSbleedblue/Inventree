# Production Dockerfile - Frontend built into container
FROM python:3.11-slim-trixie@sha256:1d6131b5d479888b43200645e03a78443c7157efbdb730e6b48129740727c312 AS base

ENV PYTHONUNBUFFERED=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV INVOKE_RUN_SHELL="/bin/bash"
ENV INVENTREE_DOCKER="true"
ENV INVENTREE_DEBUG=False

ENV INVENTREE_HOME="/home/inventree"
ENV INVENTREE_DATA_DIR="${INVENTREE_HOME}/data"
ENV INVENTREE_STATIC_ROOT="${INVENTREE_DATA_DIR}/static"
ENV INVENTREE_MEDIA_ROOT="${INVENTREE_DATA_DIR}/media"
ENV INVENTREE_BACKUP_DIR="${INVENTREE_DATA_DIR}/backup"
ENV INVENTREE_PLUGIN_DIR="${INVENTREE_DATA_DIR}/plugins"
ENV INVENTREE_BACKEND_DIR="${INVENTREE_HOME}/src/backend"

ENV INVENTREE_CONFIG_FILE="${INVENTREE_DATA_DIR}/config.yaml"
ENV INVENTREE_SECRET_KEY_FILE="${INVENTREE_DATA_DIR}/secret_key.txt"
ENV INVENTREE_WEB_ADDR=0.0.0.0
ENV INVENTREE_WEB_PORT=8000

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git gettext libldap2 wget curl \
    weasyprint libpango-1.0-0 libcairo2 poppler-utils \
    postgresql-client mariadb-client \
    fontconfig fonts-freefont-ttf fonts-terminus fonts-noto-core fonts-noto-cjk \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN rm -rf /usr/lib/python3/dist-packages/numpy \
    && rm -rf /usr/lib/python3/dist-packages/scipy \
    && rm -rf /usr/lib/python3/dist-packages/sympy

EXPOSE 8000
RUN python -m pip install --no-cache-dir -U invoke
RUN mkdir -p ${INVENTREE_HOME}
WORKDIR ${INVENTREE_HOME}

COPY contrib/container/requirements.txt base_requirements.txt
COPY tasks.py src/backend/requirements.txt contrib/container/gunicorn.conf.py contrib/container/init.sh ./
RUN chmod +x init.sh

# Builder stage - build frontend
FROM base AS builder

COPY src ${INVENTREE_HOME}/src
COPY tasks.py ${INVENTREE_HOME}/tasks.py

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config build-essential libldap2-dev libsasl2-dev libssl-dev libmariadb-dev \
    nodejs npm && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN npm install -g n yarn --ignore-scripts && yarn config set network-timeout 600000 -g
RUN bash -c "n lts"

# Install Python dependencies
RUN pip install --user --require-hashes -r base_requirements.txt --no-cache-dir && \
    pip install --user --require-hashes -r requirements.txt --no-cache-dir && \
    pip cache purge && rm -rf /root/.cache/pip

# Build frontend (compiles React to static files)
RUN cd "${INVENTREE_HOME}" && invoke int.frontend-compile --extract

# Production stage
FROM base AS production

ENV PATH=/root/.local/bin:$PATH

COPY src/backend/InvenTree ${INVENTREE_BACKEND_DIR}/InvenTree
COPY src/backend/requirements.txt ${INVENTREE_BACKEND_DIR}/requirements.txt

# Copy compiled frontend and Python dependencies from builder
COPY --from=builder /root/.local /root/.local
COPY --from=builder ${INVENTREE_BACKEND_DIR}/InvenTree/web/static/web ${INVENTREE_BACKEND_DIR}/InvenTree/web/static/web

ENTRYPOINT ["/bin/bash", "./init.sh"]
CMD ["sh", "-c", "exec gunicorn -c ./gunicorn.conf.py InvenTree.wsgi -b 0.0.0.0:8000 --chdir ${INVENTREE_BACKEND_DIR}/InvenTree"]
