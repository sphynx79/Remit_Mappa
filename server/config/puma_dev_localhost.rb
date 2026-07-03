tag 'Ampere'
threads 0, 16

require 'childprocess'

# Specifies the `port` that Puma will listen on to receive requests, default is 3000.
#
port 9292

ssl_bind 'localhost', '443',
         key: './config/localhost.key',
         cert: './config/localhost.crt'

process = ChildProcess.build('C:\APPL\caddy\caddy.exe', '-quiet', '-quic', '-conf', 'CaddyfileDev')
process.cwd = './config'
process.io.inherit!
process.leader = true
process.start
sleep 5
unless process.alive?
  p "Errore nell'avvio del server Caddy"
  exit
end

early_hints true
quiet
environment 'development'
preload_app!
