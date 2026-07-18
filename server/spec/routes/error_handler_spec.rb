# frozen_string_literal: true

RSpec.describe 'Error handler API v1' do
  it 'su Mongo::Error risponde 503 "Database non disponibile"' do
    allow(Units).to receive(:cache).and_raise(Mongo::Error, 'db giù')

    get '/api/v1/units'

    expect(last_response.status).to eq(503)
    expect(json_body['message']).to eq('Database non disponibile')
  end

  it 'su errore generico risponde 500 "Internal server error"' do
    allow(Units).to receive(:cache).and_raise(RuntimeError, 'boom')

    get '/api/v1/units'

    expect(last_response.status).to eq(500)
    expect(json_body['message']).to eq('Internal server error')
  end
end
