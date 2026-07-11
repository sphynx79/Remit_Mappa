# frozen_string_literal: true

V1::Api.route("reports") do |r|

  def get_value(start_dt, end_dt, step, type)
    # la ricerca nella cache ha sempre la key nel timezone italiano
    key_format = (type.to_s.include? 'daily') ?  "%d-%m-%Y" : "%d-%m-%Y %H:%M:%S"
    reseult = start_dt.step(end_dt, step).reduce("[".dup) do |cum, data| 
        cum << "#{Report.get_remit(cache: true, type: type, data: data.strftime(key_format))},"
    end[0..-2] << "]"
  end

  r.on String, String do |start_dt, end_dt|

    r.halt(403, json({"error" => "Start date non corretta"})) if data_is_correct(start_dt)
    r.halt(403, json({"error" => "End date non corretta"}))   if data_is_correct(end_dt)

    remaining_path = request.remaining_path.tr("/", "")
    start_dt       = r.params['cache'] == "false" ? TZ.local_to_utc(DateTime.parse(start_dt)) : DateTime.parse(start_dt)
    end_dt         = r.params['cache'] == "false" ? TZ.local_to_utc(DateTime.parse(end_dt) + (1.0 - 1.0/24/60)) : DateTime.parse(end_dt) + (1.0 - 1.0/24/60)
    r.halt(403, json({"error" => "Range date troppo ampio, massimo 366 giorni"})) if (end_dt - start_dt) > 366
    type           = remaining_path.to_sym
     
    # daily tecnologia
    r.is_exactly "centrali_tecnologia_daily" do
      if r.params['cache'] == "false"
        json(Report.get_remit(cache: false, type: type, st_dt: start_dt, end_dt: end_dt))
      else
        get_value(start_dt, end_dt, 1, type)
      end
    end

    # daily zona
    r.is_exactly "centrali_zona_daily" do
      if r.params['cache'] == "false"
        json(Report.get_remit(cache: false, type: type, st_dt: start_dt, end_dt: end_dt))
      else
        get_value(start_dt, end_dt, 1, type)
      end
    end

    # hourly tecnologia
    r.is_exactly "centrali_tecnologia_hourly" do
      if r.params['cache'] == "false"
        json(Report.get_remit(cache: false, type: type, st_dt: start_dt, end_dt: end_dt))
      else
        get_value(start_dt, end_dt, 1.0/24, type)
      end
    end

    # hourly zona
    r.is_exactly "centrali_zona_hourly" do
      if r.params['cache'] == "false"
        json(Report.get_remit(cache: false, type: type, st_dt: start_dt, end_dt: end_dt))
      else
        get_value(start_dt, end_dt, 1.0/24, type)
      end
    end

  end
end

