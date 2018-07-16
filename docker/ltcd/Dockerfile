FROM golang:1.10-alpine as builder

LABEL maintainer="Kinesis Network <kinesis.network>"


# Install build deps
RUN apk add --no-cache git \
&&  go get -u github.com/Masterminds/glide

ARG COMMIT_SHA

RUN \
# Check for mandatory build arguments
    : "${COMMIT_SHA:?COMMIT_SHA Build argument needs to be set.}"

WORKDIR $GOPATH/src/github.com/ltcsuite/ltcd

# Grab and install ltcd
RUN git clone https://github.com/ltcsuite/ltcd ./ \
&& git checkout ${COMMIT_SHA} \
&&  glide install \
&&  go install . ./cmd/ltcctl ./cmd/gencerts

# Start a new image
FROM alpine as final

# Copy the compiled binaries from the builder image.
COPY --from=builder /go/bin/ltcctl /bin/
COPY --from=builder /go/bin/ltcd /bin/
COPY --from=builder /go/bin/gencerts /bin/

COPY "start-ltcd.sh" .

# Add a cron job to be used for simnet funding
RUN mkdir "/jobs" \
&& touch "/jobs/cron.log"

COPY "funding-cron.txt" /jobs/funding-cron.txt

RUN chmod 755 /jobs/funding-cron.txt \
&& /usr/bin/crontab /jobs/funding-cron.txt

RUN apk add --no-cache \
    bash \
    ca-certificates \
&&  chmod +x start-ltcd.sh \
&&  mkdir "/secure" "/root/.ltcd" "/root/.ltcctl" \
&&  touch "/root/.ltcd/ltcd.conf"

# We set the cert host for btcd (set as --build-arg on docker build)
ARG CERT_HOST

RUN \
# Check for mandatory build arguments
    : "${CERT_HOST:?CERT_HOST Build argument needs to be set.}"

RUN "/bin/gencerts" --host=${CERT_HOST} --directory="/secure" --force

# Mainnet ports (p2p, rpc)
EXPOSE 8333 8334

# Testnet ports (p2p, rpc)
EXPOSE 18333 18334

# Simnet ports (p2p, rpc)
EXPOSE 18555 18556

# Segnet ports (p2p, rpc)
EXPOSE 28901 28902

# Create a volume to house pregenerated RPC credentials. This will be
# shared with any lnd, btcctl containers so they can securely query ltcd's RPC
# server.
# You should NOT do this before certificate generation!
# Otherwise manually generated certificate will be overridden with shared
# mounted volume! For more info read dockerfile "VOLUME" documentation.
VOLUME ["/secure"]
