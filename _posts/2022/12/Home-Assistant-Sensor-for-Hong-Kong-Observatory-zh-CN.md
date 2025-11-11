---
title: 香港天文台的 Home Assistant 传感器
date: 2022-12-01 15:04:04
tags:
  - Home Assistant
  - Open Data
categories:
  - Misc
comments: true
thumbnail: banner.jpeg
thumbnail_80: icon.jpeg
lang: zh-CN
excerpt: "将香港天文台的实时天气数据集成到 Home Assistant，监控温度、湿度和风速。"
---

## 香港天文台

### 将军澳 (TKO) 天气、湿度、温度和 10 分钟风速及风向
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
        friendly_name: "TKO 10-minute wind direction"
        value_template: "{{ states('sensor.hk_tko_wind') | regex_findall_index(find='([^,]+),') }} "
        icon_template: "hass:compass"
      tko_wind_speed:
        friendly_name: "TKO 10-minute mean speed"
        value_template: "{{ states('sensor.hk_tko_wind') | regex_findall_index(find='[^,]+,([^,]+),') }} "
        unit_of_measurement: "km/hour"
        icon_template: "hass:tailwind"
      tko_wind_gust:
        friendly_name: "TKO 10-minute max gust"
        value_template: "{{ states('sensor.hk_tko_wind') | regex_findall_index(find='[^,]+,[^,]+,([^,]+)') }} "
        unit_of_measurement: "km/hour"
        icon_template: "hass:weather-windy"
```
