#!/usr/bin/env ruby
# frozen_string_literal: true

# Avvia lo stack di produzione: Puma (SSL su hostname:443) + Caddy (:2015),
# con la config unificata che deriva hostname, certificati e Caddyfile da Socket.gethostname.
# Uso: ruby script/avvia_prod.rb (usato dal task mise server-prod)

Dir.chdir(File.expand_path('../server', __dir__))
puts 'Avvio produzione: bundle exec puma -C config/puma_prod.rb'
system('bundle', 'exec', 'puma', '-C', 'config/puma_prod.rb')
exit($CHILD_STATUS ? $CHILD_STATUS.exitstatus : 1)
