FROM golang:1.10-alpine as builder

LABEL maintainer="Kinesis Network <kinesis.network>"

# Install build dependencies such as git and glide.
RUN apk add --no-cache \
    git \
&&  go get -u github.com/Masterminds/glide

WORKDIR $GOPATH/src/github.com/btcsuite/btcd

# We use this cache date to always build LND instead of caching the files. This allows us
# to continually grab changes from the LND_VERSION without tagging the release.
# TODO: set this to a certain release commit
ARG COMMIT_SHA
RUN : "${COMMIT_SHA:?COMMIT_SHA Build argument needs to be set.}"


# Grab and install the latest version of btcd
RUN git clone https://github.com/btcsuite/btcd . \
&& git checkout ${COMMIT_SHA} \
&&  glide install \
&&  go install . ./cmd/...

# Start a new image
FROM alpine as final

# Copy the compiled binaries from the builder image.
COPY --from=builder /go/bin/addblock /bin/
COPY --from=builder /go/bin/btcctl /bin/
COPY --from=builder /go/bin/btcd /bin/
COPY --from=builder /go/bin/findcheckpoint /bin/
COPY --from=builder /go/bin/gencerts /bin/

COPY "start-btcd.sh" .

# Add a cron job to be used for simnet funding
RUN mkdir "/jobs" \
&& touch "/jobs/cron.log"

COPY "funding-cron.txt" /jobs/funding-cron.txt

RUN chmod 755 /jobs/funding-cron.txt \
&& /usr/bin/crontab /jobs/funding-cron.txt

RUN apk add --no-cache \
    bash \
    ca-certificates \
&&  mkdir "/secure" "/root/.btcd" "/root/.btcctl" \
&&  touch "/root/.btcd/btcd.conf" \
&&  chmod +x start-btcd.sh

# We set the cert host for btcd (set as --build-arg on docker build)
ARG CERT_HOST
RUN : "${CERT_HOST:?CERT_HOST Build argument needs to be set.}" \
&&  "/bin/gencerts" --host=${CERT_HOST} --directory="/secure" --force

# Mainnet (p2p, rpc)
EXPOSE 8333 8334

# Testnet (p2p, rpc)
EXPOSE 18333 18334

# Simnet (p2p, rpc)
EXPOSE 18555 18556

# Segnet (p2p, rpc)
EXPOSE 28901 28902

# Create a volume to house pregenerated RPC credentials. This will be
# shared with any lnd, btcctl containers so they can securely query btcd's RPC
# server.
# You should NOT do this before certificate generation!
# Otherwise manually generated certificate will be overridden with shared
# mounted volume! For more info read dockerfile "VOLUME" documentation.
VOLUME ["/secure"]

