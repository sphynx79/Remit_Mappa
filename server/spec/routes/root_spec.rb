# frozen_string_literal: true

RSpec.describe 'GET /' do
  it 'serve la index html del client' do
    get '/'

    expect(last_response.status).to eq(200)
    expect(last_response.content_type).to include('text/html')
    expect(last_response.body).to include('<html')
  end
end
