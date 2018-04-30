FROM golang:1.9

LABEL maintainer="Danny Paz <kinesis.exchange>"

# Grab and install the latest version of roasbeef's fork of btcd and all
# related dependencies.
RUN go get -u github.com/Masterminds/glide
RUN go get -d github.com/roasbeef/btcd

WORKDIR $GOPATH/src/github.com/roasbeef/btcd

RUN glide install
RUN go install . ./cmd/...

RUN mkdir "/secure" "/shared" "/root/.btcd" "/root/.btcctl"
RUN touch "/root/.btcd/btcd.conf"

# Manually generate certificate and add all domains, it is needed to connect
# "btcctl" and "lnd" to "btcd" over docker links.
RUN "/go/bin/gencerts" --host="*" --directory="/secure" --force

# Create a volume to house pregenerated RPC credentials. This will be
# shared with any lnd, btcctl containers so they can securely query btcd's RPC
# server.
# You should NOT do this before certificate generation!
# Otherwise manually generated certificate will be overridden with shared
# mounted volume! For more info read dockerfile "VOLUME" documentation.
VOLUME ["/secure"]

COPY "btcd/start-btcctl.sh" .
COPY "btcd/start-btcd.sh" .

RUN chmod +x start-btcctl.sh
RUN chmod +x start-btcd.sh

