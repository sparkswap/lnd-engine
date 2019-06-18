#!/usr/bin/env bash

NODE=${NODE:-litecoind}
CONFIG_FILE=/home/lnd/lnd.conf

echo "LND LTC starting with network: $NETWORK $NODE"

PARAMS=$(echo \
    "--configfile=$CONFIG_FILE" \
    "--litecoin.$NETWORK" \
    "--debuglevel=$DEBUG" \
    "--$NODE.rpcuser=$RPC_USER" \
    "--$NODE.rpcpass=$RPC_PASS" \
    "--$NODE.rpchost=$RPC_HOST" \
    "--$NODE.zmqpubrawblock=$ZMQPUBRAWBLOCK" \
    "--$NODE.zmqpubrawtx=$ZMQPUBRAWTX"
)

if [[ -n "$EXTERNAL_ADDRESS" ]] && [[ -n "$EXTERNAL_PORT" ]]; then
    if [[ "$EXTERNAL_ADDRESS" == "host.docker.internal" ]]; then
        # Using host.docker.internal to access the host IP does not work for Linux
        # This is a known issue with Docker: https://github.com/docker/for-linux/issues/264
        # Here, we manually map host.docker.internal to the host IP in /etc/hosts
        ping -q -c1 $EXTERNAL_ADDRESS > /dev/null 2>&1
        # We map host.docker.internal only if the container cannot ping the address
        # This is typically the case only for Linux
        if [ $? -ne 0 ]; then
            HOST_IP=$(ip route | awk 'NR==1 {print $3}')
            echo -e "$HOST_IP\t$EXTERNAL_ADDRESS" >> /etc/hosts
        fi
    fi
    echo "Setting external address for lnd $EXTERNAL_ADDRESS:$EXTERNAL_PORT"
    PARAMS="$PARAMS --externalip=$EXTERNAL_ADDRESS:$EXTERNAL_PORT"
fi

if [[ -n "$LND_BASE_FEE" ]]; then
    echo "Setting custom base fee for litecoin: $LND_BASE_FEE"
    PARAMS="$PARAMS --litecoin.basefee=$LND_BASE_FEE"
fi

if [[ -n "$LND_FEE_RATE" ]]; then
    echo "Setting custom fee rate for litecoin: $LND_FEE_RATE"
    PARAMS="$PARAMS --litecoin.feerate=$LND_FEE_RATE"
fi

exec lnd $PARAMS "$@"
