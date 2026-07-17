# frozen_string_literal: true

RSpec.describe 'Smoke API v1' do
  it 'GET /api/v1/units risponde 200 con JSON' do
    get '/api/v1/units'

    expect(last_response.status).to eq(200)
    expect(last_response.content_type).to include('application/json')
    expect { json_body }.not_to raise_error
  end
end
