# frozen_string_literal: true

V1::Api.route("remits") do |r|
  r.on String do |data|
    r.halt(403, json({"error" => "Data non corretta"})) if data_is_correct(data)
    # le data viene portata nel formato ora locale
    # quindi avanti di +2 ore (ora legale estate) +1 ora (ora solare inverno)
    r.is_exactly "centrali" do
      data = Date.parse(data).strftime('%d-%m-%Y')
      # data senza dati: il modello ritorna nil, che farebbe cadere Roda nel 404
      Remit.get_remit_centrali(data) || json({"type" => "FeatureCollection", "features" => []})
    end
    r.on "linee", String do |volt|
      start_dt = TZ.local_to_utc(Time.parse(data))
      end_dt = (start_dt + (3600 * 24) - 1)
      r.halt(403, json({"error" => "Volt selezionato non corretto"})) if (/^(380|220)$/ =~ volt).nil?
      json(Remit.get_remit_linee(start_dt, end_dt, volt))
    end
  end
end

