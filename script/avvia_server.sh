#!/usr/bin/env bash
# Avvio DETACHED di Puma (dev|prod): i task mise devono uscire subito perché su
# Windows la catena mise→cmd→bat resta appesa dopo il Ctrl-C dei task foreground.
# Log su file; stop con: mise run server-stop
set -uo pipefail
modo=${1:-dev}
cd "$(dirname "$0")/../server" || exit 1
mkdir -p log

if [ "$modo" = "prod" ]; then
  cmd_puma=(bundle exec puma -C config/puma_prod.rb)
  log=log/puma_prod.log
  porta=443
else
  cmd_puma=(bundle exec puma --port 9292)
  log=log/puma_dev.log
  porta=9292
fi

if netstat -ano 2>/dev/null | grep -E ":${porta} +.*LISTENING" >/dev/null; then
  echo "C'è già un server in ascolto sulla porta ${porta}: prima 'mise run server-stop'."
  exit 1
fi

setsid nohup "${cmd_puma[@]}" > "$log" 2>&1 < /dev/null &
disown
echo "Server ${modo} avviato in background (porta ${porta})."
if [ "$modo" = "prod" ]; then
  echo "App:  https://$(hostname):2015"
else
  echo "App:  http://localhost:9292"
fi
echo "Pronta a boot completato, ~30s (progresso nel log)."
echo "Log:  tail -f server/${log}"
echo "Stop: mise run server-stop"
