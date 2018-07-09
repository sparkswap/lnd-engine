FROM golang:1.10-alpine as builder

LABEL maintainer="Kinesis Network <kinesis.network>"

ARG BTCD_VERSION='86fed78'

# Install build dependencies such as git and glide.
RUN apk add --no-cache \
    git \
&&  go get -u github.com/Masterminds/glide

WORKDIR $GOPATH/src/github.com/btcsuite/btcd

# Grab and install the latest version of btcd
RUN git clone https://github.com/btcsuite/btcd . \
&& git checkout ${BTCD_VERSION} \
&&  glide install \
&&  go install . ./cmd/...

# Start a new image
FROM alpine as final

# We set the cert host for btcd as the internal macOS docker address due
# to development setup
ARG CERT_HOST='docker.for.mac.host.internal'

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
&&  chmod +x start-btcd.sh \
# Manually generate certificate and add all domains, it is needed to connect
# "btcctl" and "lnd" to "btcd" over docker links.
&& "/bin/gencerts" --host=${CERT_HOST} --directory="/secure" --force

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

