#!/usr/bin/env ruby
# Encoding: utf-8
# warn_indent: true
# frozen_string_literal: true

# Patch per psych >= 4 (Ruby 4): YAML.load ora è un safe load e rifiuta gli alias
# usati in config.yml (&defaults / <<: *defaults). Settingslogic non è piu mantenuta,
# quindi si ridefinisce il caricamento abilitando esplicitamente gli alias.
class Settingslogic
  def initialize(hash_or_file = self.class.source, section = nil)
    case hash_or_file
    when nil
      raise Errno::ENOENT, 'No file specified as Settingslogic source'
    when Hash
      self.replace hash_or_file
    else
      file_contents = File.read(hash_or_file)
      hash = file_contents.empty? ? {} : YAML.load(ERB.new(file_contents).result, aliases: true).to_hash
      if self.class.namespace
        hash = hash[self.class.namespace] or return missing_key("Missing setting '#{self.class.namespace}' in #{hash_or_file}")
      end
      self.replace hash
    end
    @section = section || self.class.source
    create_accessors!
  end
end

class Settings < Settingslogic
  source "#{APP_ROOT}/config/config.yml"
  namespace ENV['RACK_ENV']
  load!
end

