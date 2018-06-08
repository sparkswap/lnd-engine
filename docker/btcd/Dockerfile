FROM golang:1.10-alpine as builder

LABEL owner="Olaoluwa Osuntokun <laolu@lightning.network>"
LABEL maintainer="Danny Paz <kinesis.exchange>"

ARG BTCD_VERSION='bc09449'

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

# Copy the compiled binaries from the builder image.
COPY --from=builder /go/bin/addblock /bin/
COPY --from=builder /go/bin/btcctl /bin/
COPY --from=builder /go/bin/btcd /bin/
COPY --from=builder /go/bin/findcheckpoint /bin/
COPY --from=builder /go/bin/gencerts /bin/

COPY "btcd/start-btcctl.sh" .
COPY "btcd/start-btcd.sh" .

# Add a cron job to be used for simnet funding
RUN mkdir "/jobs"
RUN touch "/jobs/cron.log"
COPY "btcd/funding-cron.txt" /jobs/funding-cron.txt
RUN chmod 755 /jobs/funding-cron.txt
RUN /usr/bin/crontab /jobs/funding-cron.txt

RUN apk add --no-cache \
    bash \
    ca-certificates \
&&  mkdir "/secure" "/root/.btcd" "/root/.btcctl" \
&&  touch "/root/.btcd/btcd.conf" \
&&  chmod +x start-btcctl.sh \
&&  chmod +x start-btcd.sh \
# Manually generate certificate and add all domains, it is needed to connect
# "btcctl" and "lnd" to "btcd" over docker links.
&& "/bin/gencerts" --host="docker.for.mac.host.internal" --directory="/secure" --force

# Create a volume to house pregenerated RPC credentials. This will be
# shared with any lnd, btcctl containers so they can securely query btcd's RPC
# server.
# You should NOT do this before certificate generation!
# Otherwise manually generated certificate will be overridden with shared
# mounted volume! For more info read dockerfile "VOLUME" documentation.
VOLUME ["/secure"]

