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

  # Fix LOW-003: info con blocco logga a livello INFO (prima delegava a debug
  # e con il livello di default il messaggio veniva perso)
  it 'info con blocco logga a livello INFO' do
    Logging.logger.level = Logger::INFO
    host.info { 'messaggio da blocco' }

    expect(output.string).to include('INFO', 'messaggio da blocco')
  end
end
