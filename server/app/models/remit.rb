# frozen_string_literal: true

class Remit < Mongodb
  extend Mapbox

  class << self
   
    def refresh_cache
      pipeline = set_pipeline_centrali_cache()
      remit_result = client[:remit_centrali_last].aggregate(pipeline).allow_disk_use(true).to_a
      remit_result.collect{|v| [v[:data], v[:entries]]}.to_h
    end

    def get_remit_linee(start_dt, end_dt, volt)
      pipeline = set_pipeline_linee(start_dt, end_dt, volt)
      remit_result = client[:remit_linee].aggregate(pipeline).allow_disk_use(true).to_a
      features = features_linee(remit_result, volt, start_dt, end_dt)
      return {'type' => 'FeatureCollection', 'features' => features}
    end

    def get_remit_centrali_cache(start_dt)
      remit_result = Caddy[:cache_remits][(start_dt).strftime("%d%m%Y")]
      features = features_centrali(remit_result)
      return {'type' => 'FeatureCollection', 'features' => features}
    end

    def get_remit_centrali(start_dt, end_dt)
      pipeline = set_pipeline_centrali(start_dt, end_dt)
      remit_result = client[:remit_centrali].aggregate(pipeline).allow_disk_use(true).to_a
      features = features_centrali(remit_result)
      return {'type' => 'FeatureCollection', 'features' => features}
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
        feature['geometry'] = self.send("linee_#{volt}").detect { |f| f['id'] == id_transmission }['geometry']
        feature
      end
    end

    def features_centrali(remit_result)
      remit_result.map do |x|
        feature = {}
        etso = x['etso']
        mapbox_feature = centrali.detect { |f| f['properties']['etso'] == etso }
        feature['type'] = 'Feature'
        feature['properties'] = {}
        feature['properties']['fold'] = true
        feature['properties']['nome'] = x['etso']
        feature['properties']['company'] = mapbox_feature['properties']['company']
        feature['properties']['tipo'] = mapbox_feature['properties']['tipo']
        feature['properties']['sottotipo'] = mapbox_feature['properties']['sottotipo']
        feature['properties']['hours'] = crea_24_ore(x['hours'])
        feature['properties']['pmax'] = mapbox_feature['properties']['pmax']
        feature['properties']['update'] = x['dt_upd']
        feature['properties']['start'] = x['dt_start']
        feature['properties']['end'] = x['dt_end']
        feature['geometry'] = mapbox_feature['geometry']
        feature
      end
    end

    def crea_24_ore_linee(start_dt, end_dt, input_start_dt, input_end_dt)
      db_timerange = ( TZ.utc_to_local(start_dt) ..  TZ.utc_to_local(end_dt) ).to_time_range
      input_timerange = ( TZ.utc_to_local(input_start_dt) ..  TZ.utc_to_local(input_end_dt + 1) ).to_time_range
      overlap = db_timerange.overlap_with(input_timerange)
      hours = ('1'..'24').each_with_object(Hash.new(0)) { |key, hash| hash[key] = "0" }
      hour = overlap.min
      while (hour += 3600) <= overlap.max
        hour.hour == 0 ? hours["24"] = 1 : hours[(hour.hour).to_s] = 1
      end
      return hours
    end

    def crea_24_ore(hours)
      new_hours = ('1'..'24').each_with_object(Hash.new(0)) { |key, hash| hash[key] = "-" }

      hours.each do |x|
        new_hours[x['ora'].to_s] = x['remit']
      end
      return new_hours
    end

    def set_pipeline_centrali_cache()
      pipeline = []

      pipeline << {
          "$group": {
            _id: {
              year: '$year',
              month: '$month',
              dayOfMonth: '$dayOfMonth',
              etso: '$etso',
            },
            etso: {
              "$first": '$etso',
            },
            dt_upd: {
              '$max': {"$dateToString": {
                format: "%d-%m-%Y %H:%M",
                date: '$dt_upd',
                timezone: 'Europe/Rome',
               }},
            },
            dt_start: {
              "$min": {"$dateToString": {
                format: "%d-%m-%Y %H:%M",
                date: '$dt_start',
                timezone: 'Europe/Rome',
               }},
            },
            dt_end: {
              "$max": {"$dateToString": {
                format: "%d-%m-%Y %H:%M",
                date: '$dt_end',
                timezone: 'Europe/Rome',
               }},
            },
            hours: {
              "$push": {
                ora: {
                  "$add": [{
                    "$hour": {
                      date: '$data_hour',
                      timezone: 'Europe/Rome',
                    },
                  }, 1],

                },
                remit: '$remit',
              },
            },
          },
        }

      pipeline << {
          "$group": {
            _id: {
              year: '$_id.year',
              month: '$_id.month',
              dayOfMonth: '$_id.dayOfMonth',
            },
            entries: { "$push": {"etso": "$etso", "dt_upd": "$dt_upd", "dt_start": "$dt_start", "dt_end": "$dt_end", "hours": "$hours"} } 
          }
      }

      pipeline << {
         "$project": {
           _id: 0,
           data: { "$concat": [
            { "$cond": [
              { "$lte": ["$_id.dayOfMonth", 9]},
              { "$concat": [
                "0", { "$substr": ["$_id.dayOfMonth", 0, 2 ] }
              ]},
              { "$substr": ["$_id.dayOfMonth", 0, 2 ] }
            ]},
            { "$cond": [
              { "$lte": ["$_id.month", 9]},
              { "$concat": [
                "0", { "$substr": ["$_id.month", 0, 2 ] }
              ]},
              { "$substr": ["$_id.month", 0, 2 ] }
            ]},
            { "$toString": "$_id.year"}
           ]},
           entries: 1
         }
      }

    end

    def set_pipeline_centrali(start_dt, end_dt)
      pipeline = []

      pipeline << {"$match": {
        "$and": [{
          is_last: 1,
        },
                 {
          dt_start: {
            "$lte": end_dt,
          },
        }, {
          dt_end: {
            "$gte": start_dt,
          },
        }],
      }}

      pipeline << {
        "$unwind": '$days',
      }

      pipeline << {
        "$match": {"days.is_last": 1},
      }

      pipeline << {
        "$project": {
          _id: 0,
          msg_id: 1,
          etso: 1,
          zona: 1,
          tipo: 1,
          dt_upd: 1,
          dt_start: 1,
          dt_end: 1,
          hours: '$days.hours',
        },
      }

      pipeline << {
        "$unwind": '$hours',
      }

      pipeline << {
        "$match": {
          "hours.is_last": 1,
        },
      }

      pipeline << {
        "$match": {
          "hours.data_hour": {
            "$gte": start_dt,
            "$lte": end_dt,
          },
        },
      }

      pipeline << {
        "$sort": {"hours.data_hour": 1},
      }

      pipeline << {
        "$group": {
          _id: {
            etso: '$etso',
          },
          etso: {
            "$first": '$etso',
          },
          dt_upd: {
            '$max': '$dt_upd',
          },
          dt_start: {
            "$min": '$dt_start',
          },
          dt_end: {
            "$max": '$dt_end',
          },
          hours: {
            "$push": {
              ora: {
                "$add": [{
                  "$hour": {
                    date: '$hours.data_hour',
                    timezone: 'Europe/Rome',
                  },
                }, 1],

              },
              remit: '$hours.remit',
            },
          },
        },
      }

      pipeline << {
        "$project": {
          _id: 0,
          etso: 1,
          # la metto in timezone italiano perchè nel db è in utc,
          # ma la mia cache deve avere il formato italiano
          dt_upd: {"$dateToString": {
            format: "%d-%m-%Y %H:%M",
            date: '$dt_upd',
            timezone: 'Europe/Rome',
          }},
          dt_start: {"$dateToString": {
            format: "%d-%m-%Y %H:%M",
            date: '$dt_start',
            timezone: 'Europe/Rome',
          }},
          dt_end: {"$dateToString": {
            format: "%d-%m-%Y %H:%M",
            date: '$dt_end',
            timezone: 'Europe/Rome',
          }},
          hours: 1,
        },
      }

      return pipeline
    end

    def set_pipeline_linee(start_dt, end_dt, volt)
      pipeline = []
      pipeline << {:$match => {"volt": volt}}
      # pipeline << {:$match => {"dt_upd": {:$lte => start_dt}, "volt": volt}}
      pipeline << {:$match => {"start_dt": {:$lte => end_dt}, "end_dt": {:$gte => start_dt}}}
      pipeline << {:$group => {
        '_id': '$nome',
        'dt_upd': {
          '$last': '$dt_upd',
        },
        'nome': {
          '$first': '$nome',
        },
        'volt': {
          '$first': '$volt',
        },
        'start_dt': {
          '$first': '$start_dt',
        },
        'end_dt': {
          '$first': '$end_dt',
        },
        'reason': {
          '$first': '$reason',
        },
        'id_transmission': {
          '$first': '$id_transmission',
        },
      }}
      return pipeline
    end
  end
end

