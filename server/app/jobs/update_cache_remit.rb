#!/usr/bin/env ruby
# Encoding: utf-8
# warn_indent: true
# frozen_string_literal: true

class UpdateCacheRemit
  attr_reader :name, :description, :execution_interval, :timeout_interval
  def initialize
    @name = "cache_remits"
    @description = "Update della cache delle remit"
    @execution_interval = 1800
    @timeout_interval   = 30
    @expiration_time    = 7200
  end

  def init
    Concurrent::TimerTask.new(
      run_now: true,
      execution_interval: @execution_interval,
      # timeout_interval: @timeout_interval
    ) do
      Remit.refresh_cache(expiration_time: @expiration_time)
      nil # no need for the {#Concurrent::TimerTask} to keep a reference to the value
    end
  end

end

