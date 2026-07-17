# frozen_string_literal: true

# Date fisse dentro lo snapshot del DB di test (2016 - gennaio 2019).
# MAI usare Date.today nelle spec: lo snapshot non ha dati correnti.
module DateFixtures
  GIORNO_OK           = '15-06-2018'
  REPORT_START        = '01-06-2018'
  REPORT_END          = '10-06-2018'
  # per le rotte hourly con cache: ogni giorno sono 24 chiavi di cache (fetch
  # sincroni sul DB al primo hit) -> range corto per tenere veloce la suite
  REPORT_END_HOURLY   = '02-06-2018'
  GIORNO_SENZA_DATI   = '01-06-2025' # fuori snapshot: nessun dato
  # giorno 32: respinta dalla regex di data_is_correct. NB: la regex accetta
  # anche il formato ISO yyyy-mm-dd e date impossibili tipo 00-00-2018 (LOW-001)
  DATA_MALFORMATA     = '32-06-2018'
  RANGE_AMPIO_START   = '01-01-2017' # con REPORT_END -> piu di 366 giorni
  # i report daily nello snapshot arrivano al 03-11-2021: questo range è coperto solo in parte
  RANGE_PARZIALE_START = '31-10-2021'
  RANGE_PARZIALE_END   = '05-11-2021'
end

module JsonHelper
  def json_body
    JSON.parse(last_response.body)
  end
end
