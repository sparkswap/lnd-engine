set -e

echo "Engine.createNewAddress().then(console.log)" | docker-compose run lnd_repl


echo -n "Give me the mining address ok: "
read answer

# Given the address generated above, we can now restart btcd to mine
MINING_ADDRESS="$answer" docker-compose up -d btcd

GENERATE_CMD='btcctl --simnet --rpcuser="$RPC_USER" --rpcpass="$RPC_PASS" --rpccert="$RPC_CERT" generate 400'
docker-compose exec -T btcd /bin/sh -c "$GENERATE_CMD"

echo "Engine.getTotalBalance().then(console.log)" | docker-compose run lnd_repl
