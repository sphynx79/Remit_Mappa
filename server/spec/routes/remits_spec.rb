# frozen_string_literal: true

RSpec.describe 'API v1 remits' do

  describe 'GET /api/v1/remits/:data/centrali' do
    it 'con data nello snapshot risponde 200 con una FeatureCollection' do
      get "/api/v1/remits/#{DateFixtures::GIORNO_OK}/centrali"

      expect(last_response.status).to eq(200)
      expect(json_body['type']).to eq('FeatureCollection')
      expect(json_body['features']).to be_an(Array)
      expect(json_body['features']).not_to be_empty
    end

    it 'con data malformata risponde 403' do
      get "/api/v1/remits/#{DateFixtures::DATA_MALFORMATA}/centrali"

      expect(last_response.status).to eq(403)
      expect(json_body['error']).to eq('Data non corretta')
    end

    # Comportamento attuale fotografato (MED-001): data valida ma senza dati
    # -> il modello ritorna nil -> Roda cade nel not_found con messaggio fuorviante
    it 'con data valida ma senza dati risponde 404 "Api non trovata"' do
      get "/api/v1/remits/#{DateFixtures::GIORNO_SENZA_DATI}/centrali"

      expect(last_response.status).to eq(404)
      expect(json_body['error']).to include('non trovata')
    end
  end

  describe 'GET /api/v1/remits/:data/linee/:volt' do
    %w[380 220].each do |volt|
      it "con volt #{volt} risponde 200 con una FeatureCollection" do
        get "/api/v1/remits/#{DateFixtures::GIORNO_OK}/linee/#{volt}"

        expect(last_response.status).to eq(200)
        expect(json_body['type']).to eq('FeatureCollection')
        expect(json_body['features']).to be_an(Array)
      end
    end

    it 'con volt non valido risponde 403' do
      get "/api/v1/remits/#{DateFixtures::GIORNO_OK}/linee/132"

      expect(last_response.status).to eq(403)
      expect(json_body['error']).to eq('Volt selezionato non corretto')
    end

    it 'con data malformata risponde 403' do
      get "/api/v1/remits/#{DateFixtures::DATA_MALFORMATA}/linee/380"

      expect(last_response.status).to eq(403)
      expect(json_body['error']).to eq('Data non corretta')
    end
  end
end
