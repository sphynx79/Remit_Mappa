# frozen_string_literal: true

RSpec.describe RequestHelpers do
  # self.included chiama base.plugin (API di Roda): per testare i metodi in
  # isolamento serve un finto host con plugin no-op
  let(:helper) do
    dummy = Class.new do
      def self.plugin(*); end
      include RequestHelpers
    end
    dummy.new
  end

  # NB (LOW-001): nome invertito — ritorna truthy quando la data NON è valida
  describe '#data_is_correct' do
    it 'ritorna falsy per una data dd-mm-yyyy valida' do
      expect(helper.data_is_correct('15-06-2018')).to be_falsy
    end

    it 'accetta anche il formato ISO yyyy-mm-dd' do
      expect(helper.data_is_correct('2018-06-15')).to be_falsy
    end

    it 'ritorna truthy per una data malformata' do
      expect(helper.data_is_correct('32-06-2018')).to be_truthy
      expect(helper.data_is_correct('foo')).to be_truthy
      expect(helper.data_is_correct('')).to be_truthy
    end

    # Comportamento attuale fotografato (LOW-001): la regex accetta date impossibili
    it 'accetta date impossibili come 00-00-2018' do
      expect(helper.data_is_correct('00-00-2018')).to be_falsy
    end
  end

  describe '#json' do
    it 'serializza un hash in JSON compatto' do
      expect(helper.json({ 'a' => 1 })).to eq('{"a":1}')
    end

    it 'senza argomenti serializza un hash vuoto' do
      expect(helper.json).to eq('{}')
    end
  end
end
