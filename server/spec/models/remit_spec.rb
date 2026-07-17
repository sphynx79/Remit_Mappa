# frozen_string_literal: true

RSpec.describe Remit do
  describe '.get_remit_centrali' do
    it 'con data nello snapshot ritorna una FeatureCollection serializzata' do
      result = described_class.get_remit_centrali(DateFixtures::GIORNO_OK)

      expect(result).to be_a(String)
      parsed = JSON.parse(result)
      expect(parsed['type']).to eq('FeatureCollection')
      expect(parsed['features']).not_to be_empty
    end

    it 'al secondo hit sulla stessa key serve dalla cache senza rifare la fetch' do
      described_class.get_remit_centrali(DateFixtures::GIORNO_OK)
      expect(described_class.cache).to have_key(DateFixtures::GIORNO_OK)

      allow(described_class).to receive(:fetch_from_db)
        .and_raise('fetch inattesa: la cache non è stata usata')

      expect(described_class.get_remit_centrali(DateFixtures::GIORNO_OK)).to be_a(String)
    end

    # Il modello ritorna nil su data senza dati; la rotta lo traduce in
    # FeatureCollection vuota (contratto MED-001)
    it 'con data valida ma senza dati ritorna nil' do
      expect(described_class.get_remit_centrali(DateFixtures::GIORNO_SENZA_DATI)).to be_nil
    end
  end

  describe '.get_remit_linee' do
    it 'ritorna una FeatureCollection (Hash) per le linee 380' do
      start_dt = TZ.local_to_utc(Time.parse(DateFixtures::GIORNO_OK))
      end_dt   = start_dt + (3600 * 24) - 1

      result = described_class.get_remit_linee(start_dt, end_dt, '380')

      expect(result['type']).to eq('FeatureCollection')
      expect(result['features']).to be_an(Array)
    end
  end
end
