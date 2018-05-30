set -e

echo "Engine.createNewAddress().then(console.log)" | docker-compose run lnd_repl


echo -n "Give me the mining address ok: "
read answer

# Given the address generated above, we can now restart btcd to mine
MINING_ADDRESS="$answer" docker-compose up -d btcd

GENERATE_CMD='btcctl --simnet --rpcuser="$RPC_USER" --rpcpass="$RPC_PASS" --rpccert="$RPC_CERT" generate 400'
docker-compose exec -T btcd /bin/sh -c "$GENERATE_CMD"

echo -n "Give me the public key of your relayer"

sleep 5

CREATE_CHANNEL="Engine.createChannel('docker.for.mac.host.internal:10111', '03224d527c38b81f5f31e07194d048b4d12b86c6e3c947da46b68dca176d50f1f4', '20000').then(console.log).catch(console.error)"
echo "$CREATE_CHANNEL" | docker-compose run lnd_repl
