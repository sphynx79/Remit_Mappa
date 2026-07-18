# frozen_string_literal: true

RSpec.describe 'API v1 not found' do
  it 'su rotta inesistente risponde 404 con errore JSON' do
    get '/api/v1/rotta_che_non_esiste'

    expect(last_response.status).to eq(404)
    expect(last_response.content_type).to include('application/json')
    expect(json_body['error']).to include('non trovata')
  end
end
