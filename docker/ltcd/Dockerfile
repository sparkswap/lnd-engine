FROM golang:1.10-alpine as builder

LABEL maintainer="SparkSwap <dev@sparkswap.com>"

# Install build deps
RUN apk add --no-cache git \
&&  go get -u github.com/Masterminds/glide

ARG COMMIT_SHA
RUN : "${COMMIT_SHA:?COMMIT_SHA Build argument needs to be set.}"

WORKDIR $GOPATH/src/github.com/ltcsuite/ltcd

# Grab and install ltcd
RUN git clone https://github.com/ltcsuite/ltcd ./ \
&&  git checkout ${COMMIT_SHA} \
# We need to cherry-pick a change from another branch which fixes
# the expected witness return types when querying for
# transactions over rpc. The fix adds behaivor for treating witnesses
# as an array of strings instead of a single string.
# Without this fix, we will receive errors when creating channels between
# 2 LTCD nodes.
#
# More info on the fix here: https://github.com/ltcsuite/ltcd/pull/7
# TODO: Remove this hack
&&  git remote add dev git://github.com/cfromknecht/btcd \
&&  git fetch dev \
# We must set git configuration to use `git merge`
&&  git config --global user.email "dev@sparkswap.com" \
&&  git config --global user.name "dev" \
# Merges the fix/single change into ltcd
&&  git merge dev/rpc-witness-serialization-fix \
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
RUN : "${CERT_HOST:?CERT_HOST Build argument needs to be set.}" \
&&  "/bin/gencerts" --host=${CERT_HOST} --directory="/secure" --force

# TODO: figure out correct ports for ltcd
# Mainnet ports (p2p, rpc)
EXPOSE 9335 9334

# Testnet ports (p2p, rpc)
EXPOSE 19335 19334

# Simnet ports (p2p, rpc)
EXPOSE 18555 18556

# Segnet ports (p2p, rpc)
EXPOSE 28901 28902
