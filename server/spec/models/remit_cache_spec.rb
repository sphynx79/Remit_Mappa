# frozen_string_literal: true

RSpec.describe Remit do
  describe 'warm-up on-miss della cache' do
    it 'una data storica non innesca il warm-up dei giorni attorno (MED-004)' do
      allow(Concurrent::ScheduledTask).to receive(:execute)

      described_class.get_remit_centrali('01-02-2016')

      expect(Concurrent::ScheduledTask).not_to have_received(:execute)
    end

    # Eccezione motivata alla regola "mai Date.today": il comportamento sotto test
    # dipende dalla distanza della data da oggi (value nil in cache, va bene così)
    it 'una data vicina a oggi innesca il warm-up' do
      described_class.class_variable_get(:@@warmup_pendente).delete(:remit)
      allow(Concurrent::ScheduledTask).to receive(:execute)

      described_class.get_remit_centrali((Date.today - 3).strftime('%d-%m-%Y'))

      expect(Concurrent::ScheduledTask).to have_received(:execute).once
    end
  end

  describe 'warm-up attorno a oggi' do
    it 'stampa e rilancia i fallimenti (la Promise li inghiottirebbe in silenzio)' do
      allow(described_class).to receive(:refresh_cache_around_day).and_raise(Mongo::Error, 'pool esaurito')

      expect {
        expect { described_class.refresh_cache_around_today }.to raise_error(Mongo::Error)
      }.to output(/Refresh cache remits FALLITO: Mongo::Error/).to_stdout
    end
  end

  describe 'thread-safety della cache (HIGH-006)' do
    it 'sotto accesso concorrente la stessa key viene fetchata una sola volta' do
      chiamate = Concurrent::AtomicFixnum.new(0)
      allow(described_class).to receive(:fetch_from_db).and_wrap_original do |originale, *args|
        chiamate.increment
        originale.call(*args)
      end

      risultati = Array.new(8) { Thread.new { described_class.get_remit_centrali('20-06-2018') } }.map(&:value)

      expect(risultati.uniq.size).to eq(1)
      expect(chiamate.value).to eq(1)
    end

    it 'delete_expired_key elimina le entry scadute e conserva le valide' do
      described_class.cache['chiave-scaduta-test'] = { value: 'x', expiration_time: Time.now.to_i - 10 }
      described_class.cache['chiave-valida-test']  = { value: 'y', expiration_time: Time.now.to_i + 1000 }

      described_class.delete_expired_key

      expect(described_class.cache.key?('chiave-scaduta-test')).to be false
      expect(described_class.cache.key?('chiave-valida-test')).to be true
      described_class.cache.delete('chiave-valida-test')
    end
  end
end
