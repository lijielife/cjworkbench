# 0. The barest Python: used in dev and prod
FROM python:3.6.6-slim-stretch AS pybase

# We probably don't want these, long-term.
# nano: because we edit files on production
# postgresql-client: because we poll the DB:
# * on prod before ./manage.py migrate
# * on unittest before ./manage.py test
# git: because sometimes we throw git revisions in the Pipfile -- which is always lazy
RUN mkdir -p /usr/share/man/man1 /usr/share/man/man7 \
    && apt-get update \
    && apt-get install --no-install-recommends -y \
        git \
        nano \
        postgresql-client \
    && rm -rf /var/lib/apt/lists/*

RUN pip install pipenv==2018.7.1

# Set up /app
RUN mkdir /app
WORKDIR /app

# 0.1 Pydev: just for the development environment
FROM pybase AS pydev

# Need build-essential for:
# * regex (TODO nix the dep or make it support manylinux .whl)
# * Twisted - https://twistedmatrix.com/trac/ticket/7945
# * fastparquet
# * python-snappy
RUN mkdir -p /root/.local/share/virtualenvs \
    && apt-get update \
    && apt-get install --no-install-recommends -y \
      build-essential \
      libsnappy-dev \
    && rm -rf /var/lib/apt/lists/*

# Add a Python wrapper that will help PyCharm cooperate with pipenv
# See https://blog.jetbrains.com/pycharm/2015/12/using-docker-in-pycharm/ for
# PyCharm's expectations. Just set "Python interpreter path" to
# "pipenv-run-python" to ensure:
#
# * `cd /app`: PyCharm mounts the source tree to `/opt/project` and overwrites
#              the current working directory. We force `cd /app` to restore
#              what the Dockerfile already specifies. That's important because
#              `pipenv` looks for packages in a virtualenv named after the
#              current working directory.
#
# * `exec pipenv run python "$@"`: PyCharm does not let us specify a command
#                                  for Docker to run. It only lets us specify
#                                  "Python interpreter path." This wrapper will
#                                  provide the interface PyCharm expects, with
#                                  the environment variables Python needs to
#                                  find our virtualenv.
#
# Why do we create the file with RUN instead of COPY? Because even in 2018,
# COPY does not copy the executable bit on Windows, so we need a RUN anyway
# to make it executable.
RUN true \
    && echo '#!/bin/sh\ncd /app\nexec pipenv run python "$@"' >/usr/bin/pipenv-run-python \
    && chmod +x /usr/bin/pipenv-run-python

# 1. Python deps -- which rarely change, so this part of the Dockerfile will be
# cached (when building locally)
FROM pybase AS pybuild

# Install Python dependencies. They rarely change.
# For Docker images we install them to the local system, not to a virtualenv.
# Containers don't use pipenv.
COPY Pipfile Pipfile.lock /app/

# Need build-essential for:
# * hiredis - https://github.com/redis/hiredis-py/issues/38
# * regex (TODO nix the dep or make it support manylinux .whl)
# * Twisted - https://twistedmatrix.com/trac/ticket/7945
# * fastparquet
# * python-snappy
# ... and we want to keep libsnappy around after the fact, too
RUN true \
    && apt-get update \
    && apt-get install --no-install-recommends -y \
      build-essential \
      libsnappy1v5 \
      libsnappy-dev \
    && pipenv install --dev --system --deploy \
    && apt-get remove --purge -y \
      build-essential \
      libsnappy-dev \
    && apt-get autoremove --purge -y \
    && rm -rf /var/lib/apt/lists/*

# nltk models (for sentiment)
RUN python -m nltk.downloader -d /usr/local/share/nltk_data vader_lexicon


# 2. Node deps -- completely independent
# 2.1 jsbase: what we use in dev-in-docker
FROM node:10.1.0-slim as jsbase

RUN mkdir /app
WORKDIR /app

# 2.2 jsbuild: where we build JavaScript assets
FROM jsbase AS jsbuild

COPY package.json package-lock.json /app/
RUN npm install

COPY webpack.config.js setupJest.js /app/
COPY __mocks__/ /app/__mocks__/
COPY assets/ /app/assets/
# Inject unit tests into our continuous integration
# This is how Travis tests
RUN npm test
RUN node_modules/.bin/webpack -p


# 3. Three prod servers will all be based on the same stuff:
FROM pybuild AS base

# assets/ is static files. TODO nix them here; host them elsewhere
COPY assets/ /app/assets/
COPY --from=jsbuild /app/assets/bundles/ /app/assets/bundles/
COPY --from=jsbuild /app/webpack-stats.json /app/
COPY cjworkbench/ /app/cjworkbench/
COPY server/ /app/server/
COPY bin/ /app/bin/
COPY templates/ /app/templates/
COPY manage.py /app/

# 3.1. migrate: runs ./manage.py migrate
FROM base AS migrate
CMD [ "bin/migrate-prod" ]

# 3.2. backend: runs background tasks
FROM base AS backend
CMD [ "./manage.py", "run-background-loop" ]

# 3.3. frontend: serves website
FROM base AS frontend
# 8080 is Kubernetes' conventional web-server port
EXPOSE 8080
# TODO nix --insecure; serve static files elsewhere
CMD [ "./manage.py", "runserver", "--insecure", "0.0.0.0:8080" ]
