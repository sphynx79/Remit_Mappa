#!/usr/bin/env ruby
# frozen_string_literal: true

# Avvia Puma in produzione: usa la config per-host (config/puma_prod_<HOSTNAME>.rb)
# se esiste, altrimenti un avvio semplice in RACK_ENV=production su :9292.
# Uso: ruby script/avvia_prod.rb (usato dal task mise server-prod)
require 'socket'

Dir.chdir(File.expand_path('../server', __dir__))
config = File.join('config', "puma_prod_#{Socket.gethostname}.rb")

if File.exist?(config)
  puts "Avvio produzione con config per-host: #{config}"
  system('bundle', 'exec', 'puma', '-C', config)
else
  puts "Nessuna config per-host (#{config}): avvio semplice in produzione su :9292"
  ENV['RACK_ENV'] = 'production'
  system('bundle', 'exec', 'puma', '--port', '9292')
end
exit($CHILD_STATUS ? $CHILD_STATUS.exitstatus : 1)
