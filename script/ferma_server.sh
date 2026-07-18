#!/usr/bin/env bash
# Ferma Puma (dev e/o prod) e Caddy. Usato dal task mise server-stop.
set -uo pipefail
fermato=0

for porta in 443 9292; do
  pid=$(netstat -ano 2>/dev/null | grep -E ":${porta} +.*LISTENING" | awk '{print $NF}' | sort -u | head -1)
  if [ -n "${pid:-}" ]; then
    /c/Windows/System32/taskkill.exe //F //PID "$pid" >/dev/null 2>&1 \
      && echo "Puma sulla porta ${porta} fermato (PID ${pid})." && fermato=1
  fi
done

/c/Windows/System32/taskkill.exe //F //IM caddy.exe >/dev/null 2>&1 \
  && echo "Caddy fermato." && fermato=1

[ "$fermato" = 0 ] && echo "Nessun server in esecuzione."
exit 0
