#!/usr/bin/env ruby
# frozen_string_literal: true

# Avvia lo stack di produzione: Puma (SSL su hostname:443) + Caddy (:2015),
# con la config unificata che deriva hostname, certificati e Caddyfile da Socket.gethostname.
# Uso: ruby script/avvia_prod.rb (usato dal task mise server-prod)

Dir.chdir(File.expand_path('../server', __dir__))
puts 'Avvio produzione: bundle exec puma -C config/puma_prod.rb (Ctrl-C per fermare)'

# il Ctrl-C della console arriva anche a questo wrapper: lo si ignora e si lascia
# a Puma lo shutdown graceful, aspettando che il figlio esca
trap('INT') {}
system('bundle', 'exec', 'puma', '-C', 'config/puma_prod.rb')
stato = $?

# Caddy gira in un process group separato (leader) e NON riceve il Ctrl-C:
# senza questa pulizia resterebbe vivo attaccato alla console, bloccando il terminale
system('taskkill', '/F', '/IM', 'caddy.exe', out: File::NULL, err: File::NULL)
puts 'Stack di produzione fermato (Puma e Caddy chiusi).'

exit(stato && stato.exitstatus ? stato.exitstatus : 0)
