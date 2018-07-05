FROM golang:1.10-alpine as builder

LABEL maintainer="Kinesis Network <kinesis.network>"

ARG LTCD_VERSION='master'

# Grab and install the latest version of roasbeef's fork of ltcd and all
# related dependencies.
WORKDIR $GOPATH/src/github.com/ltcsuite/ltcd

# Install build deps
RUN apk add --no-cache git \
&&  go get -u github.com/Masterminds/glide

# Grab and install ltcd
RUN git clone https://github.com/ltcsuite/ltcd ./ \
&& git checkout ${LTCD_VERSION} \
&&  glide install \
&&  go install . ./cmd/ltcctl ./cmd/gencerts

# Start a new image
FROM alpine as final

# We set the cert host for btcd as the internal macOS docker address due
# to development setup
ARG CERT_HOST='docker.for.mac.host.internal'

# Copy the compiled binaries from the builder image.
COPY --from=builder /go/bin/ltcctl /bin/
COPY --from=builder /go/bin/ltcd /bin/
COPY --from=builder /go/bin/gencerts /bin/

COPY "start-ltcd.sh" .

RUN apk add --no-cache \
    bash \
    ca-certificates \
&&  chmod +x start-ltcd.sh \
&&  mkdir "/secure" "/root/.ltcd" "/root/.ltcctl" \
&&  touch "/root/.ltcd/ltcd.conf" \
# "ltcctl" and "lnd" to "ltcd" over docker links.
&&  "/bin/gencerts" --host=${CERT_HOST} --directory="/secure" --force

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
