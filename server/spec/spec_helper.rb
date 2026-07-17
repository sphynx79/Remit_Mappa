# frozen_string_literal: true

ENV['RACK_ENV'] = 'test'

if ENV['RUN_COVERAGE_REPORT']
  require 'simplecov'

  SimpleCov.start do
    add_filter %r{^/spec/}
    add_filter %r{^/config/}
    add_filter %r{^/bin/}
  end

  # ratchet: appena sotto il valore misurato (88.32% al 17-07-2026) — può solo salire.
  # Lo scoperto residuo è giustificato: warm-up disattivati nei test, blocchi
  # configure :development/:production, rescue "DB irraggiungibile"
  SimpleCov.minimum_coverage 88
end

require_relative '../server'

# boot_jobs pianifica il warm-up delle cache 2 secondi dopo il boot: nei test è
# solo rumore (query su date correnti, assenti dallo snapshot 2016-2019).
# La ridefinizione arriva prima dello scatto del timer, quindi i TimerTask non partono.
class Scheduler
  def self.start; end
end

# Il warm-up massivo "attorno a oggi/alla data richiesta" macina centinaia di
# query su date fuori snapshot: lo si azzera, mantenendo però l'inizializzazione
# REALE delle cache via refresh_cache (senza, @@cache resta nil e le rotte danno 500).
[Remit, Report].each do |model|
  model.singleton_class.class_eval do
    define_method(:refresh_cache_around_day) { |**| nil }
  end
end

require 'rack/test'

Dir[File.join(__dir__, 'support', '**', '*.rb')].sort.each { |f| require f }

module AppHelper
  def app
    Server.app
  end
end

RSpec.configure do |config|
  config.include Rack::Test::Methods
  config.include AppHelper
  config.include JsonHelper

  # le cache le inizializzano solo i job di warm-up (qui disattivati):
  # senza refresh esplicito units risponde "null" e le altre rotte 500
  config.before(:suite) do
    Units.refresh_cache
    Remit.refresh_cache
    Report.refresh_cache
  end

  config.disable_monkey_patching!
  config.expect_with :rspec do |expectations|
    expectations.syntax = :expect
  end
end
