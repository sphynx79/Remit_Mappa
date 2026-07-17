#!/usr/bin/env ruby
# Encoding: utf-8
# warn_indent: true
# frozen_string_literal: true

class UpdateCacheUnits
  attr_reader :name, :description, :execution_interval, :timeout_interval
  def initialize
    @name = "cache_units"
    @description = "Update della cache delle unita"
    @execution_interval = 60*60*8
    @timeout_interval   = 30
  end

  def init
    Concurrent::TimerTask.new(
      run_now: true,
      execution_interval: @execution_interval,
      # timeout_interval: @timeout_interval
    ) do
      Units.refresh_cache
      nil # no need for the {#Concurrent::TimerTask} to keep a reference to the value
    end
  end

end

