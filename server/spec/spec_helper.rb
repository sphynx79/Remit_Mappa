# frozen_string_literal: true

ENV['RACK_ENV'] = 'test'

if ENV['RUN_COVERAGE_REPORT']
  require 'simplecov'

  SimpleCov.start do
    add_filter %r{^/spec/}
    add_filter %r{^/config/}
    add_filter %r{^/bin/}
  end
end

require_relative '../server'

# boot_jobs pianifica il warm-up delle cache 2 secondi dopo il boot: nei test è
# solo rumore (query su date correnti, assenti dallo snapshot 2016-2019).
# La ridefinizione arriva prima dello scatto del timer, quindi il warm-up non parte.
class Scheduler
  def self.start; end
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

  config.disable_monkey_patching!
  config.expect_with :rspec do |expectations|
    expectations.syntax = :expect
  end
end
