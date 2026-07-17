# frozen_string_literal: true

RSpec.describe Report do
  describe 'warm-up on-miss della cache' do
    # Eccezione motivata alla regola "mai Date.today": il comportamento sotto test
    # dipende dalla distanza della data da oggi; le date correnti non hanno dati
    # nello snapshot e va bene così (value nil in cache)
    it 'ogni miss su una data diversa innesca il proprio warm-up (MED-005)' do
      allow(Concurrent::ScheduledTask).to receive(:execute)
      key1 = (Date.today - 1).strftime('%d-%m-%Y')
      key2 = (Date.today - 2).strftime('%d-%m-%Y')

      described_class.get_remit(cache: true, type: :centrali_tecnologia_daily, data: key1)
      described_class.get_remit(cache: true, type: :centrali_tecnologia_daily, data: key2)

      expect(Concurrent::ScheduledTask).to have_received(:execute).twice
    end

    it 'una data storica non innesca il warm-up dei giorni attorno (MED-004)' do
      allow(Concurrent::ScheduledTask).to receive(:execute)

      described_class.get_remit(cache: true, type: :centrali_tecnologia_daily, data: '01-02-2016')

      expect(Concurrent::ScheduledTask).not_to have_received(:execute)
    end
  end

  describe 'thread-safety della cache (HIGH-006)' do
    it 'sotto accesso concorrente la stessa key viene fetchata una sola volta' do
      chiamate = Concurrent::AtomicFixnum.new(0)
      allow(described_class).to receive(:fetch_from_db).and_wrap_original do |originale, *args|
        chiamate.increment
        originale.call(*args)
      end

      risultati = Array.new(8) do
        Thread.new { described_class.get_remit(cache: true, type: :centrali_zona_daily, data: '21-06-2018') }
      end.map(&:value)

      expect(risultati.uniq.size).to eq(1)
      expect(chiamate.value).to eq(1)
    end

    it 'delete_expired_key elimina le entry scadute per il tipo' do
      described_class.cache[:centrali_tecnologia_daily]['chiave-scaduta-test'] =
        { value: 'x', expiration_time: Time.now.to_i - 10 }

      described_class.delete_expired_key(:centrali_tecnologia_daily)

      expect(described_class.cache[:centrali_tecnologia_daily].key?('chiave-scaduta-test')).to be false
    end
  end
end
