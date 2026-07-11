#!/usr/bin/env ruby
# Encoding: utf-8
# warn_indent: true
# frozen_string_literal: true

class Mongodb
  cattr :client

  # @TODO: mettere nel config il loggin level di mongodb
  Mongo::Logger.logger.level = ::Logger::FATAL

  def self.client
    @@client ||= connect_db
  end

  #
  # Si Connette al server
  #
  # @raise [Mongo::Error::NoServerAvailable] se non riesce a connettersi
  #
  # @note write => 0 nessun acknowledged (pero quando vado fare update o scritture non ho nessun risultato)
  #       write => 1 restituisce un acknowledged (quindi quando faccio update o scritture mi dice il numero di documenti scritti)
  #
  # @return [Mongo::Client]
  #
  def self.connect_db
    client = Mongo::Client.new(Settings.database.adress,
                               database: Settings.database.name,
                               write: { w: 0, j: false },
                               wait_queue_timeout: 3,
                               min_pool_size: 10,
                               max_pool_size: 50)
    client.database_names
    client
  rescue Mongo::Error::NoServerAvailable
    warn <<~MESSAGE
      Non riesco connetermi al db:
      1) Controllare che il server mongodb sia avviato
      2) Controllare in config che IP, PORTA, NOME database siano corretti
    MESSAGE
    raise
  end
end
