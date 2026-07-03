tag 'Ampere'
threads 1, 8

require 'childprocess'

# Specifies the `port` that Puma will listen on to receive requests, default is 3000.
#
#port 3000

bind 'tcp://ENWS26975477:443'
#bind 'tcp://ENWS26975477:3000'

ssl_bind 'ENWS26975477', '443', {
  key: "./config/ENWS26975477.key",
  cert: "./config/ENWS26975477.crt"
}


process = ChildProcess.build('C:\APPL\caddy\caddy.exe', "-quiet", "-quic", "-conf", "CaddyfileProd_ENWS26975477")
process.cwd = '.\config'
process.io.inherit!
process.leader = true
process.start
sleep 5
unless process.alive?
  p "Errore nell'avvio del server Caddy"
  exit
end

early_hints true
environment "production"
preload_app!


