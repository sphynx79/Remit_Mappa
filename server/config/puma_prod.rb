tag 'Ampere'
threads 1, 8

require 'childprocess'
require 'socket'

# config unica per tutti gli host di produzione: l'hostname determina bind,
# certificati (config/<host>.key/.crt) e Caddyfile (config/CaddyfileProd_<host>)
hostname = Socket.gethostname

# Specifies the `port` that Puma will listen on to receive requests, default is 3000.
#
#port 3000

bind "tcp://#{hostname}:443"
#bind "tcp://#{hostname}:3000"

ssl_bind hostname, '443', {
  key: "./config/#{hostname}.key",
  cert: "./config/#{hostname}.crt"
}


caddy_exe = ENV.fetch('CADDY_EXE', 'C:\APPL\caddy\caddy.exe')
process = ChildProcess.build(caddy_exe, "-quiet", "-quic", "-conf", "CaddyfileProd_#{hostname}")
process.cwd = '.\config'
process.io.inherit!
process.leader = true
process.start
sleep 5
unless process.alive?
  p "Errore nell'avvio del server Caddy"
  exit
end

# allo stop di Puma (Ctrl-C compreso) termina anche Caddy: gira in un process
# group separato, non riceve il Ctrl-C e resterebbe appeso alla console
after_stopped do
  begin
    process.stop
  rescue StandardError
    nil
  end
end

early_hints true
environment "production"
preload_app!
