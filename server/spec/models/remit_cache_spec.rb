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
      allow(Concurrent::ScheduledTask).to receive(:execute)

      described_class.get_remit_centrali((Date.today - 3).strftime('%d-%m-%Y'))

      expect(Concurrent::ScheduledTask).to have_received(:execute).once
    end
  end
end
