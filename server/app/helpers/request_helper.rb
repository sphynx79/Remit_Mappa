#!/usr/bin/env ruby
# Encoding: utf-8
# warn_indent: true
# frozen_string_literal: true

module RequestHelpers
  def self.included(base)
    # Rack 3: gli header di risposta vanno in minuscolo
    base.plugin :default_headers, 'content-type' => 'application/json'
    base.plugin :error_handler do |e|
      log_message = "\n#{e.class} (#{e.message}):\n"
      log_message += "  #{e.backtrace.join("\n  ")}\n\n" if e.backtrace
      puts log_message
      if e.is_a?(Mongo::Error)
        response.status = 503
        json({ message: 'Database non disponibile' })
      else
        json({ message: 'Internal server error' })
      end
    end
  end

  def data_is_correct(data)
    (/(^([0-2][0-9]|(3)[0-1])(-)(((0)[0-9])|((1)[0-2]))(-)\d{4}$)|(^([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))$)/ =~ data).nil?
  end

  def json(body = {})
    Oj.dump(body, mode: :compat)
  end
end
