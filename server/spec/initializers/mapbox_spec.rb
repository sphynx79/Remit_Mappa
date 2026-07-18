# frozen_string_literal: true

RSpec.describe Mapbox do
  it 'get_json_data segnala con messaggio chiaro gli errori di rete e rilancia' do
    allow(Net::HTTP).to receive(:new).and_raise(SocketError, 'getaddrinfo fallita')

    expect {
      expect { Remit.get_json_data('https://api.mapbox.com/dataset') }.to raise_error(SocketError)
    }.to output(/dataset Mapbox/).to_stderr
  end

  it 'extended segnala con messaggio chiaro i dataset non validi e rilancia' do
    originale = described_class.class_variable_get(:@@linee_380)
    described_class.class_variable_set(:@@linee_380, nil)
    dummy = Class.new do
      def self.get_json_data(_url)
        'non-e-json'
      end
    end

    expect {
      expect { described_class.extended(dummy) }.to raise_error(EncodingError)
    }.to output(/formato atteso/).to_stderr
  ensure
    described_class.class_variable_set(:@@linee_380, originale)
  end
end
