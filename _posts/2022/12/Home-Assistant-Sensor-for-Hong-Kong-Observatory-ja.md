---
title: 香港天文台のHome Assistantセンサー
date: 2022-12-01 15:04:04
tags:
  - Home Assistant
  - Open Data
categories:
  - Misc
thumbnail: /2022/12/Home-Assistant-Sensor-for-Hong-Kong-Observatory/banner.jpeg
thumbnail_80: /2022/12/Home-Assistant-Sensor-for-Hong-Kong-Observatory/icon.jpeg
spell_checked: 2025-07-01
grammar_checked: 2025-07-01
lang: ja
excerpt: "リアルタイムの香港天文台気象データをHome Assistantに統合します。すぐに使えるセンサー設定で、地域の気温、湿度、風速を監視できます。"
---

## 香港天文台

### 将軍澳（TKO）の天気、湿度、気温、10分間の風速と風向
```
  - platform: rest
    name: hko_tko_humidity
    resource: https://data.weather.gov.hk/weatherAPI/hko_data/regional-weather/latest_1min_humidity.csv
    value_template: "{{ value | regex_findall_index(find='Tseung Kwan O,(.*)') | float | round(0) }}"
    device_class: "humidity"
    unit_of_measurement: "%"
    scan_interval: 600
  - platform: rest
    name: hko_tko_temperature
    resource: https://data.weather.gov.hk/weatherAPI/hko_data/regional-weather/latest_1min_temperature.csv
    value_template: "{{ value | regex_findall_index(find='Tseung Kwan O,(.*)') | float | round(1) }}"
    device_class: "temperature"
    unit_of_measurement: "°C"
    scan_interval: 600
  - platform: rest
    name: hk_tko_wind
    resource: https://data.weather.gov.hk/weatherAPI/hko_data/regional-weather/latest_10min_wind.csv
    value_template: "{{ value | regex_findall_index(find='Tseung Kwan O,(.*)') }}"
    scan_interval: 600
  - platform: template
    sensors:
      tko_wind_direction:
        friendly_name: "TKO 10分間の風向"
        value_template: "{{ states('sensor.hk_tko_wind') | regex_findall_index(find='([^,]+),') }} "
        icon_template: "hass:compass"
      tko_wind_speed:
        friendly_name: "TKO 10分間の平均風速"
        value_template: "{{ states('sensor.hk_tko_wind') | regex_findall_index(find='[^,]+,([^,]+),') }} "
        unit_of_measurement: "km/時"
        icon_template: "hass:tailwind"
      tko_wind_gust:
        friendly_name: "TKO 10分間の最大突風"
        value_template: "{{ states('sensor.hk_tko_wind') | regex_findall_index(find='[^,]+,[^,]+,([^,]+)') }} "
        unit_of_measurement: "km/時"
        icon_template: "hass:weather-windy"
```
