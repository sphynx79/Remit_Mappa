# frozen_string_literal: true

RSpec.describe 'GET /api/v1/units' do
  it 'risponde 200 con la lista delle unità' do
    get '/api/v1/units'

    expect(last_response.status).to eq(200)
    expect(last_response.content_type).to include('application/json')
    expect(json_body).to be_an(Array)
    expect(json_body).not_to be_empty
    expect(json_body.first.keys).to include('etso', 'tipo', 'company', 'pmax')
  end
end
