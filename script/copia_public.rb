#!/usr/bin/env ruby
# frozen_string_literal: true

# Copia il bundle di produzione del client (client/dist) in server/public.
# Uso: ruby script/copia_public.rb (da qualunque directory; usato dal task mise bundle-prod)
require 'fileutils'

root       = File.expand_path('..', __dir__)
dist       = File.join(root, 'client', 'dist')
public_dir = File.join(root, 'server', 'public')

abort 'client/dist non trovata o incompleta: lanciare prima la build (npm run build)' unless File.exist?(File.join(dist, 'index.html'))

%w[js css fonts].each do |dir|
  FileUtils.rm_rf(File.join(public_dir, dir))
  FileUtils.cp_r(File.join(dist, dir), File.join(public_dir, dir))
end
FileUtils.cp(File.join(dist, 'index.html'), File.join(public_dir, 'index.html'))

totale = Dir.glob(File.join(public_dir, '**', '*')).count { |f| File.file?(f) }
puts "Bundle copiato in server/public (#{totale} file)"
