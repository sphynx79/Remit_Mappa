# frozen_string_literal: true

RSpec.describe Scheduler do
  it 'registra i tre job di warm-up delle cache' do
    jobs = described_class.jobs

    expect(jobs.map(&:class)).to contain_exactly(UpdateCacheReport, UpdateCacheRemit, UpdateCacheUnits)
  end

  it 'ogni job costruisce un TimerTask (senza eseguirlo)' do
    described_class.jobs.each do |job|
      expect(job.init).to be_a(Concurrent::TimerTask)
    end
  end
end
