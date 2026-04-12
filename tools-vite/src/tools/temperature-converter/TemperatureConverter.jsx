export function celsiusToFahrenheit(c) {
  return c * 9 / 5 + 32;
}

export function fahrenheitToCelsius(f) {
  return (f - 32) * 5 / 9;
}

export function celsiusToKelvin(c) {
  return c + 273.15;
}

export function kelvinToCelsius(k) {
  return k - 273.15;
}

export function celsiusToRankine(c) {
  return (c + 273.15) * 9 / 5;
}

export function rankineToCelsius(r) {
  return (r * 5 / 9) - 273.15;
}

export function formatTemperature(value) {
  return Math.round(value * 100) / 100;
}