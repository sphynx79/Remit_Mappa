# frozen_string_literal: true

RSpec.describe Units do
  describe '.get_all_units' do
    it 'ritorna le properties di tutte le centrali' do
      units = described_class.get_all_units

      expect(units).to be_an(Array)
      expect(units).not_to be_empty
      expect(units.first).to include('etso', 'tipo', 'company', 'pmax')
    end
  end

  describe '.refresh_cache' do
    it 'popola la cache di classe' do
      described_class.refresh_cache

      expect(described_class.cache).to eq(described_class.get_all_units)
    end
  end
end
