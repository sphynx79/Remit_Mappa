# frozen_string_literal: true

class Remit < Mongodb
  extend Mapbox
  # mattr :cache_remit
  cattr :cache

  # inizializzazione al load della classe (non lazy in refresh_cache): nei primi
  # secondi dopo il boot le richieste arrivano PRIMA del job di warm-up, e con
  # @@cache nil andavano in 500. Concurrent::Map perche' letta/scritta da Puma,
  # TimerTask e Parallel (HIGH-006)
  @@cache            = Concurrent::Map.new
  @@warmup_pendente  = Concurrent::Map.new
  @@expiration_time  = 240

  class << self

    def refresh_cache(expiration_time: 240)
      # print "Refresh cache .......\n"
      @@expiration_time = expiration_time
      Concurrent::Promise.new{refresh_cache_around_today}.then{delete_expired_key }.execute
    end

    # miss atomico: compute_if_absent garantisce un solo fetch per key anche sotto concorrenza
    def fetch_from_cache(key)
      @@cache.compute_if_absent(key) do
        # puts "did not find key #{key} in cache, fetch from db ..."
        # il warm-up dei giorni attorno serve solo per la navigazione sulle date correnti:
        # sulle date storiche basta il fetch puntuale della key richiesta (MED-004).
        # Un solo warm-up pendente alla volta (riarmabile), per non saturare il pool Mongo
        if (Date.today - Date.strptime(key, "%d-%m-%Y")).abs <= 30 && @@warmup_pendente.put_if_absent(:remit, true).nil?
          Concurrent::ScheduledTask.execute(4) do
              refresh_cache_around_day(data: Date.strptime(key,"%d-%m-%Y"), keep_old: true,  keep_day: false, around_before: 10, around_after: 10)
          ensure
            @@warmup_pendente.delete(:remit)
          end
        end
        { value: fetch_from_db(key), expiration_time: Time.now.to_i + @@expiration_time }
      end
    end

    def refresh_cache_around_day(data: nil, keep_old: false, keep_day: false, around_before: 30, around_after: 30)
      # p "refresh cache aroud day => #{data}"
      step        = 1.0
      data_parser = '%d-%m-%Y'
      st_dt       = data - around_before
      end_dt      = data + around_after

      range_date = st_dt.step(end_dt, step).map { |e| e.strftime(data_parser) }
      range_date.delete_if { |x| x.include?(data.strftime('%d-%m-%Y')) } unless keep_day

      Parallel.each(range_date, in_threads: 8) do |key|
        remit = fetch_from_db(key)
        next if remit.nil?
        if (!keep_old || !@@cache.key?(key))
          @@cache[key] = { value: remit, expiration_time: Time.now.to_i + @@expiration_time }
        end
      end
    end

    def refresh_cache_around_today
      prima         = Time.now
      around_before = 180
      around_after  = 30
      today         = Date.today
      refresh_cache_around_day(data: today, keep_old: false, keep_day: true, around_before: around_before, around_after: around_after)
      puts "Refresh cache remits in: #{Time.now - prima}"
    end

    def delete_expired_key
      # print "delete expired key to remit\n"
      now   = Time.now.to_i
      @@cache.each_pair { |key, v| @@cache.delete(key) if now > v[:expiration_time] }
    end

    def get_remit_linee(start_dt, end_dt, volt)
      pipeline = set_pipeline_linee(start_dt, end_dt, volt)
      remit_result = client[:remit_linee].aggregate(pipeline).allow_disk_use(true).to_a
      features = features_linee(remit_result, volt, start_dt, end_dt)
      { 'type' => 'FeatureCollection', 'features' => features }
    end

    def get_remit_centrali(data)
      fetch_from_cache(data)[:value]
        # .yield_self { |remit| features_centrali(remit) }
        # .yield_self { |features| Hash[type: 'FeatureCollection', features: features] }
    end

    def fetch_from_db(data)
      pipeline = set_pipeline_centrali(data)
      remit_result = client[:remit_centrali_last].aggregate(pipeline).allow_disk_use(true).to_a
      if remit_result.empty?
        nil
      else
        remit_result[0]['entries']
          .yield_self { |remit| features_centrali(remit) }
          .yield_self { |features| Hash[type: 'FeatureCollection', features: features] }
          .yield_self { |feature_collection|  Oj.dump(feature_collection, mode: :compat) }
      end
    end

    def features_linee(remit_result, volt, input_start_dt, input_end_dt)
      remit_result.map do |x|
        feature = {}
        id_transmission = x['id_transmission']
        feature['type'] = 'Feature'
        feature['properties'] = {}
        feature['properties']['fold'] = true
        feature['properties']['nome'] = x['nome']
        # feature["properties"]["volt"]     = x["volt"]
        feature['properties']['hours'] = crea_24_ore_linee(x['start_dt'], x['end_dt'], input_start_dt, input_end_dt)
        feature['properties']['update'] = TZ.utc_to_local(x['dt_upd']).strftime('%d-%m-%Y %H:%M')
        feature['properties']['start'] = TZ.utc_to_local(x['start_dt']).strftime('%d-%m-%Y %H:%M')
        feature['properties']['end'] = TZ.utc_to_local(x['end_dt']).strftime('%d-%m-%Y %H:%M')
        feature['geometry'] = send("linee_#{volt}").detect { |f| f['id'] == id_transmission }['geometry']
        feature
      end
    end

    def features_centrali(remit_result)
      #remit_result.map do |x|
      Parallel.map(remit_result, in_threads: 8) do |x|
        feature                            = {}
        etso                               = x['etso']
        mapbox_feature                     = centrali.detect { |f| f['properties']['etso'] == etso }
        feature['type']                    = 'Feature'
        feature['properties']              = {}
        feature['properties']['fold']      = true
        feature['properties']['nome']      = x['etso']
        feature['properties']['company']   = mapbox_feature['properties']['company']
        feature['properties']['tipo']      = mapbox_feature['properties']['tipo']
        feature['properties']['sottotipo'] = mapbox_feature['properties']['sottotipo']
        feature['properties']['hours']     = crea_24_ore(x['hours'])
        feature['properties']['pmax']      = mapbox_feature['properties']['pmax']
        feature['properties']['update']    = x['dt_upd']
        feature['properties']['start']     = x['dt_start']
        feature['properties']['end']       = x['dt_end']
        feature['geometry']                = mapbox_feature['geometry']
        feature
      end
    end

    def crea_24_ore_linee(start_dt, end_dt, input_start_dt, input_end_dt)
      db_timerange = (TZ.utc_to_local(start_dt)..TZ.utc_to_local(end_dt)).to_time_range
      input_timerange = (TZ.utc_to_local(input_start_dt)..TZ.utc_to_local(input_end_dt + 1)).to_time_range
      overlap = db_timerange.overlap_with(input_timerange)
      hours = ('1'..'24').each_with_object(Hash.new(0)) { |key, hash| hash[key] = '0' }
      hour = overlap.min
      while (hour += 3600) <= overlap.max
        hour.hour == 0 ? hours['24'] = 1 : hours[hour.hour.to_s] = 1
      end
      hours
    end

    def crea_24_ore(hours)
      new_hours = ('1'..'24').each_with_object(Hash.new(0)) { |key, hash| hash[key] = '-' }

      hours.each do |x|
        new_hours[x['ora'].to_s] = x['remit']
      end
      new_hours
    end

    def set_pipeline_centrali(data)
      pipeline = []

      pipeline << {
        "$match": { data: data}
      }

      pipeline << {
        "$group": {
          _id: {
            year: '$year',
            month: '$month',
            dayOfMonth: '$dayOfMonth',
            etso: '$etso'
          },
          etso: {
            "$first": '$etso'
          },
          dt_upd: {
            '$max': { "$dateToString": {
              format: '%d-%m-%Y %H:%M',
              date: '$dt_upd',
              timezone: 'Europe/Rome'
            } }
          },
          dt_start: {
            "$min": { "$dateToString": {
              format: '%d-%m-%Y %H:%M',
              date: '$dt_start',
              timezone: 'Europe/Rome'
            } }
          },
          dt_end: {
            "$max": { "$dateToString": {
              format: '%d-%m-%Y %H:%M',
              date: '$dt_end',
              timezone: 'Europe/Rome'
            } }
          },
          hours: {
            "$push": {
              ora: {
                "$add": [{
                  "$hour": {
                    date: '$data_hour',
                    timezone: 'Europe/Rome'
                  }
                }, 1]

              },
              remit: '$remit'
            }
          }
        }
      }

      pipeline << {
        "$group": {
          _id: {
            year: '$_id.year',
            month: '$_id.month',
            dayOfMonth: '$_id.dayOfMonth'
          },
          entries: { "$push": { "etso": '$etso', "dt_upd": '$dt_upd', "dt_start": '$dt_start', "dt_end": '$dt_end', "hours": '$hours' } }
        }
      }

      pipeline << {
        "$project": {
          _id: 0,
          data: { "$concat": [
            { "$cond": [
              { "$lte": ['$_id.dayOfMonth', 9] },
              { "$concat": [
                '0', { "$substr": ['$_id.dayOfMonth', 0, 2] }
              ] },
              { "$substr": ['$_id.dayOfMonth', 0, 2] }
            ] },
            { "$cond": [
              { "$lte": ['$_id.month', 9] },
              { "$concat": [
                '0', { "$substr": ['$_id.month', 0, 2] }
              ] },
              { "$substr": ['$_id.month', 0, 2] }
            ] },
            { "$toString": '$_id.year' }
          ] },
          entries: 1
        }
      }

      pipeline
    end

    def set_pipeline_linee(start_dt, end_dt, volt)
      pipeline = []
      pipeline << { :$match => { "volt": volt } }
      # pipeline << {:$match => {"dt_upd": {:$lte => start_dt}, "volt": volt}}
      pipeline << { :$match => { "start_dt": { :$lte => end_dt }, "end_dt": { :$gte => start_dt } } }
      pipeline << { :$group => {
        '_id': '$nome',
        'dt_upd': {
          '$last': '$dt_upd'
        },
        'nome': {
          '$first': '$nome'
        },
        'volt': {
          '$first': '$volt'
        },
        'start_dt': {
          '$first': '$start_dt'
        },
        'end_dt': {
          '$first': '$end_dt'
        },
        'reason': {
          '$first': '$reason'
        },
        'id_transmission': {
          '$first': '$id_transmission'
        }
      } }
      pipeline
    end
  end
end
