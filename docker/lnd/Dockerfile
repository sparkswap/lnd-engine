FROM golang:1.12-alpine as builder

LABEL maintainer="sparkswap <dev@sparkswap.com>"

ARG NETWORK
RUN : "${NETWORK:?NETWORK Build argument needs to be set.}"

# Force Go to use the cgo based DNS resolver. This is required to ensure DNS
# queries required to connect to linked containers succeed.
ENV GODEBUG netdns=cgo

# Install dependencies and install/build lnd.
RUN apk add --no-cache --update alpine-sdk \
    git \
    make

WORKDIR $GOPATH/src/github.com/lightningnetwork/lnd

# We use this cache date to always build LND instead of caching the files. This allows us
# to continually grab changes from the LND_VERSION without tagging the release.
# TODO: set this to a certain release commit
ARG COMMIT_SHA
RUN : "${COMMIT_SHA:?COMMIT_SHA Build argument needs to be set.}"

RUN git clone https://github.com/lightningnetwork/lnd . \
&&  git checkout ${COMMIT_SHA} \
&&  make \
&&  make install tags="signrpc walletrpc chainrpc invoicesrpc"

# Start a new, final image to reduce size.
FROM alpine as final

ARG NETWORK
RUN : "${NETWORK:?NETWORK Build argument needs to be set.}"

# Copy the binaries and entrypoint from the builder image.
COPY --from=builder /go/bin/lncli /bin/
COPY --from=builder /go/bin/lnd /bin/

# Add bash.
RUN apk add --no-cache \
    bash

# Expose lnd ports (server, rpc).
EXPOSE 9735 10009

# Make lnd folder default.
WORKDIR /home/lnd

COPY "start-lnd-${NETWORK}.sh" "./start-lnd.sh"
RUN chmod +x ./start-lnd.sh

# Set NODE to an env so we can use it in the start script
ARG NODE
RUN : "${NODE:?NODE Build argument needs to be set.}"
ENV NODE ${NODE}

COPY "./conf/lnd-${NODE}.conf" "./lnd.conf"

# Create backup directory for static channel backup file
RUN mkdir -p /backup

CMD ["bash", "-c", "NODE=${NODE} ./start-lnd.sh"]
