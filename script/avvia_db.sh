#!/usr/bin/env bash
# Avvio DETACHED del MongoDB (test|prod): stessa ragione di avvia_server.sh.
# Arresto pulito con: mise run db-test-stop / db-prod-stop
set -uo pipefail
modo=${1:-test}

if [ "$modo" = "prod" ]; then
  args=(--dbpath 'E:\Desktop\Ampere\DB\mongodata' --port 27018 --bind_ip ENWS27719997,127.0.0.1 --logpath 'E:\Desktop\Ampere\DB\log\mongod.log')
  porta=27018
else
  args=(--dbpath 'E:\Desktop\Ampere\DB_test\data' --port 27030 --bind_ip 127.0.0.1 --nojournal --logpath 'E:\Desktop\Ampere\DB_test\mongod.log')
  porta=27030
fi

if netstat -ano 2>/dev/null | grep -E ":${porta} +.*LISTENING" >/dev/null; then
  echo "MongoDB ${modo} già in ascolto sulla porta ${porta}."
  exit 0
fi

setsid nohup '/c/Appl/Mongodb/bin/mongod.exe' "${args[@]}" > /dev/null 2>&1 < /dev/null &
disown
echo "MongoDB ${modo} avviato in background (porta ${porta})."
echo "Stop pulito: mise run db-${modo}-stop"
