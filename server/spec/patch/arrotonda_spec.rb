# frozen_string_literal: true

RSpec.describe 'Time#arrotonda' do
  it 'arrotonda per difetto sotto la metà dell\'intervallo' do
    expect(Time.at(129).arrotonda(60)).to eq(Time.at(120))
  end

  it 'arrotonda per eccesso sopra la metà dell\'intervallo' do
    expect(Time.at(151).arrotonda(60)).to eq(Time.at(180))
  end

  # comportamento attuale fotografato: il resto è calcolato su to_i, quindi con
  # sec=1 il resto è sempre 0 e i decimali NON vengono troncati
  it 'con default 1 secondo lascia i decimali intatti' do
    expect(Time.at(100.4).arrotonda).to eq(Time.at(100.4))
  end
end
