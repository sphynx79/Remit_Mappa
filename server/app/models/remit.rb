# frozen_string_literal: true

class Remit < Mongodb
  extend Mapbox
  # mattr :cache_remit
  cattr :cache

  class << self

    def refresh_cache(expiration_time: 240)
      # print "Refresh cache .......\n"
      @@expiration_time ||= expiration_time
      @@cache ||= Hash.new do |hash, key|
        puts "did not find key in cache, fetch from db ..."
        Concurrent::ScheduledTask.execute(4) do
          refresh_cache_around_day(data: Date.strptime(key,"%d-%m-%Y"), keep_old: true,  keep_day: false)
        end
        @@cache[key] = {entries: fetch_from_db(key), expiration_time: Time.now.to_i + @@expiration_time}
      end
      Concurrent::Promise.new{refresh_cache_around_today}.then{delete_expired_key }.execute
    end

    def refresh_cache_around_today
      # print "refresh around today\n"
      refresh_cache_around_day(data: Date.today, keep_old: false, keep_day: true)
    end
    
    def refresh_cache_around_day(data: nil, keep_old: false, keep_day: false)
      # p "refresh cache aroud day => #{data}"
      range_date = keep_day ? (data-5..data+5).to_a : (data-5..data+5).to_a - [data]
      (range_date).each do |dt|
        dt.strftime('%d-%m-%Y').tap do |key|
          remit = fetch_from_db(key)
          next if remit.nil?
          if (!keep_old || !@@cache.key?(key))
            # p "Aggiorno day: #{key}"
            @@cache[key] = {entries: remit, expiration_time: Time.now.to_i + @@expiration_time}
          end
        end
      end
    end

    def delete_expired_key
      print "delete expired key to remit\n"
      now   = Time.now.to_i
      @@cache.delete_if { |_, v| now > v[:expiration_time] }
    end

    def get_remit_linee(start_dt, end_dt, volt)
      pipeline = set_pipeline_linee(start_dt, end_dt, volt)
      remit_result = client[:remit_linee].aggregate(pipeline).allow_disk_use(true).to_a
      features = features_linee(remit_result, volt, start_dt, end_dt)
      { 'type' => 'FeatureCollection', 'features' => features }
    end

    def get_remit_centrali(data)
      # pp  @@cache.keys.sort
      @@cache[data][:entries]
        .yield_self { |remit| features_centrali(remit) }
        .yield_self { |features| Hash[type: 'FeatureCollection', features: features] }
    end

    def fetch_from_db(data)
      pipeline = set_pipeline_centrali(data)
      remit_result = client[:remit_centrali_last].aggregate(pipeline).allow_disk_use(true).to_a
      # data = remit_result[0]['data']
      remit_result.empty? ? nil : remit_result[0]['entries']
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
      # remit_result.map do |x|
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
