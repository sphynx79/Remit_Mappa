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
  end
end
