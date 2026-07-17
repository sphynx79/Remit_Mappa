# frozen_string_literal: true

RSpec.describe 'API v1 reports' do

  DAILY_TYPES  = %w[centrali_tecnologia_daily centrali_zona_daily].freeze
  HOURLY_TYPES = %w[centrali_tecnologia_hourly centrali_zona_hourly].freeze

  DAILY_TYPES.each do |type|
    describe "GET /api/v1/reports/:start/:end/#{type}" do
      it 'con cache risponde 200 con JSON parsabile' do
        get "/api/v1/reports/#{DateFixtures::REPORT_START}/#{DateFixtures::REPORT_END}/#{type}"

        expect(last_response.status).to eq(200)
        expect { json_body }.not_to raise_error
        expect(json_body).to be_an(Array)
      end

      it 'senza cache risponde 200 con JSON parsabile' do
        get "/api/v1/reports/#{DateFixtures::REPORT_START}/#{DateFixtures::REPORT_END}/#{type}?cache=false"

        expect(last_response.status).to eq(200)
        expect { json_body }.not_to raise_error
      end
    end
  end

  HOURLY_TYPES.each do |type|
    describe "GET /api/v1/reports/:start/:end/#{type}" do
      it 'con cache risponde 200 con JSON parsabile' do
        get "/api/v1/reports/#{DateFixtures::REPORT_START}/#{DateFixtures::REPORT_END_HOURLY}/#{type}"

        expect(last_response.status).to eq(200)
        expect { json_body }.not_to raise_error
        expect(json_body).to be_an(Array)
      end

      it 'senza cache risponde 200 con JSON parsabile' do
        get "/api/v1/reports/#{DateFixtures::REPORT_START}/#{DateFixtures::REPORT_END_HOURLY}/#{type}?cache=false"

        expect(last_response.status).to eq(200)
        expect { json_body }.not_to raise_error
      end
    end
  end

  describe 'validazioni' do
    it 'con data malformata risponde 403' do
      get "/api/v1/reports/#{DateFixtures::DATA_MALFORMATA}/#{DateFixtures::REPORT_END}/centrali_tecnologia_daily"

      expect(last_response.status).to eq(403)
      expect(json_body['error']).to eq('Start date non corretta')
    end

    it 'con range oltre 366 giorni risponde 403' do
      get "/api/v1/reports/#{DateFixtures::RANGE_AMPIO_START}/#{DateFixtures::REPORT_END}/centrali_tecnologia_daily"

      expect(last_response.status).to eq(403)
      expect(json_body['error']).to include('366')
    end
  end

  describe 'date senza dati (fix HIGH-001)' do
    it 'con cache risponde 200 con array JSON vuoto' do
      get '/api/v1/reports/01-06-2025/05-06-2025/centrali_tecnologia_daily'

      expect(last_response.status).to eq(200)
      expect(json_body).to eq([])
    end

    it 'con range coperto solo in parte ritorna i soli giorni con dati' do
      get "/api/v1/reports/#{DateFixtures::RANGE_PARZIALE_START}/#{DateFixtures::RANGE_PARZIALE_END}/centrali_tecnologia_daily"

      expect(last_response.status).to eq(200)
      expect(json_body).to be_an(Array)
      expect(json_body).not_to be_empty
      expect(json_body.size).to be < 6
    end
  end
end
