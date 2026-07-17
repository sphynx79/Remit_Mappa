# frozen_string_literal: true

RSpec.describe Logging do
  let(:output) { StringIO.new }
  let(:host)   { Class.new { include Logging }.new }

  around do |example|
    original = Logging.logger
    Logging.logger = Logger.new(output)
    example.run
    Logging.logger = original
  end

  it 'info senza blocco logga a livello INFO' do
    host.info('messaggio informativo')

    expect(output.string).to include('INFO', 'messaggio informativo')
  end

  it 'error logga a livello ERROR' do
    host.error('boom')

    expect(output.string).to include('ERROR', 'boom')
  end

  it 'warn logga a livello WARN' do
    host.warn('attenzione')

    expect(output.string).to include('WARN', 'attenzione')
  end

  it 'warn con blocco logga a livello WARN' do
    host.warn { 'attenzione da blocco' }

    expect(output.string).to include('WARN', 'attenzione da blocco')
  end

  it 'error con blocco logga a livello ERROR' do
    host.error { 'boom da blocco' }

    expect(output.string).to include('ERROR', 'boom da blocco')
  end

  it 'debug logga a livello DEBUG (con e senza blocco)' do
    Logging.logger.level = Logger::DEBUG
    host.debug('dettaglio')
    host.debug { 'dettaglio da blocco' }

    expect(output.string).to include('DEBUG', 'dettaglio', 'dettaglio da blocco')
  end

  # Comportamento attuale fotografato (LOW-003): info con blocco delega a
  # logger.debug, quindi il messaggio esce come DEBUG...
  it 'info con blocco logga a livello DEBUG invece che INFO' do
    Logging.logger.level = Logger::DEBUG
    host.info { 'messaggio da blocco' }

    expect(output.string).to include('DEBUG', 'messaggio da blocco')
    expect(output.string).not_to include('INFO')
  end

  # ...e con il livello di default (INFO) il messaggio viene perso del tutto
  it 'info con blocco a livello INFO perde il messaggio' do
    Logging.logger.level = Logger::INFO
    host.info { 'messaggio da blocco' }

    expect(output.string).to be_empty
  end
end
