#!/usr/bin/env ruby
# Encoding: utf-8
# warn_indent: true
# frozen_string_literal: true

module Mapbox
  mattr :centrali, :linee_380, :linee_220
  @@dataset_linee380_url = "#{Settings.mapbox.url}/datasets/v1/browserino/cjcb6ahdv0daq2xnwfxp96z9t/features?access_token=#{Settings.mapbox.api_token}"
  @@dataset_linee220_url = "#{Settings.mapbox.url}/datasets/v1/browserino/cjcfb90n41pub2xp6liaz7quj/features?access_token=#{Settings.mapbox.api_token}"
  @@dataset_centrali_url = "#{Settings.mapbox.url}/datasets/v1/browserino/cjaoj0nr54iq92wlosvaaki0y/features?access_token=#{Settings.mapbox.api_token}"

  def self.extended(klass)
    @@centrali ||= klass.get_centrali
    @@linee_380 ||= Oj.load(klass.get_json_data(@@dataset_linee380_url), mode: :compat)['features']
    @@linee_220 ||= Oj.load(klass.get_json_data(@@dataset_linee220_url), mode: :compat)['features']
  rescue NoMethodError, Oj::ParseError
    warn <<~MESSAGE
      I dataset Mapbox non hanno il formato atteso (manca "features"):
      1) Controllare che MAPBOX_API_TOKEN sia un token valido
      2) Controllare che i dataset esistano ancora sull'account Mapbox
    MESSAGE
    raise
  end

  def centrali
      @@centrali ||= get_centrali
  end

  def get_centrali
    url_base = Settings.mapbox.url
    access_token = Settings.mapbox.api_token
    start = nil
    features = []

    loop do
      url ="#{url_base}/datasets/v1/browserino/cjaoj0nr54iq92wlosvaaki0y/features?&start=#{start}&access_token=#{access_token}"
      response = get_json_data(url)

      data =Oj.load(response, mode: :compat)["features"]
      features.concat(data)

      last_id = data.last["id"] unless data.empty?

      start = last_id
      break if start.nil?
    end
    features
  end

  def linee_380
    @@linee_380 ||= Oj.load(get_json_data(@@dataset_linee380_url), mode: :compat)['features']
  end

  def linee_220
    @@linee_220 ||= Oj.load(get_json_data(@@dataset_linee220_url), mode: :compat)['features']

  end

  def get_json_data(url)
    uri = URI.parse(url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.verify_mode = OpenSSL::SSL::VERIFY_NONE
    http.get(uri.request_uri).body
  rescue SocketError, SystemCallError, Net::OpenTimeout, Net::ReadTimeout, OpenSSL::SSL::SSLError
    warn <<~MESSAGE
      Non riesco a scaricare i dataset Mapbox da #{uri.host}:
      1) Controllare la connessione di rete / proxy verso api.mapbox.com
      2) Controllare che MAPBOX_API_TOKEN sia valido
    MESSAGE
    raise
  end
end
