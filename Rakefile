# frozen_string_literal: true

# Task di avvio dalla ROOT del repo: entrano in server/ solo dentro il processo
# rake (la shell resta nella root, anche dopo il Ctrl-C). Puma parte in-process
# (Puma::CLI): catena shell -> ruby, Ctrl-C pulito senza strati mise/cmd.
# Uso: rake server_dev | rake server_prod
ENV['BUNDLE_GEMFILE'] ||= File.expand_path('server/Gemfile', __dir__)
require 'bundler/setup'

desc 'Avvia il server di sviluppo in foreground su :9292 (Ctrl-C per fermare)'
task :server_dev do
  Dir.chdir(File.expand_path('server', __dir__))
  require 'puma/cli'
  Puma::CLI.new(['--port', '9292']).run
end

desc 'Avvia lo stack di produzione in foreground, Puma SSL + Caddy (Ctrl-C per fermare)'
task :server_prod do
  Dir.chdir(File.expand_path('server', __dir__))
  require 'puma/cli'
  Puma::CLI.new(['-C', 'config/puma_prod.rb']).run
end
