# frozen_string_literal: true

# Date fisse dentro lo snapshot del DB di test (2016 - gennaio 2019).
# MAI usare Date.today nelle spec: lo snapshot non ha dati correnti.
module DateFixtures
  GIORNO_OK          = '15-06-2018'
  REPORT_START       = '01-06-2018'
  REPORT_END         = '10-06-2018'
  GIORNO_SENZA_DATI  = '01-06-2025' # fuori snapshot: nessun dato
  DATA_MALFORMATA    = '2018-06-15' # formato ISO, non accettato dall'API (atteso dd-mm-yyyy)
end

module JsonHelper
  def json_body
    JSON.parse(last_response.body)
  end
end
