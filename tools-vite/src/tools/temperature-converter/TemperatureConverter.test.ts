import { describe, it, expect } from 'vitest';
import { celsiusToFahrenheit, fahrenheitToCelsius, celsiusToKelvin, kelvinToCelsius, celsiusToRankine, rankineToCelsius, formatTemperature } from './TemperatureConverter.jsx';

describe('TemperatureConverter', () => {
  describe('celsiusToFahrenheit', () => {
    describe('Happy Flow - Standard conversions', () => {
      it('converts 0°C to 32°F (freezing point of water)', () => {
        expect(celsiusToFahrenheit(0)).toBe(32);
      });

      it('converts 100°C to 212°F (boiling point of water)', () => {
        expect(celsiusToFahrenheit(100)).toBe(212);
      });

      it('converts 37°C to 98.6°F (body temperature)', () => {
        expect(celsiusToFahrenheit(37)).toBe(98.6);
      });

      it('converts 20°C to 68°F (room temperature)', () => {
        expect(celsiusToFahrenheit(20)).toBe(68);
      });

      it('converts -40°C to -40°F (special point where C = F)', () => {
        expect(celsiusToFahrenheit(-40)).toBe(-40);
      });
    });

    describe('Edge Cases - Negative temperatures', () => {
      it('converts -10°C to 14°F', () => {
        expect(celsiusToFahrenheit(-10)).toBe(14);
      });

      it('converts -273.15°C to -459.67°F (absolute zero)', () => {
        expect(celsiusToFahrenheit(-273.15)).toBeCloseTo(-459.67, 2);
      });
    });

    describe('Edge Cases - Large numbers', () => {
      it('converts 1000°C to 1832°F', () => {
        expect(celsiusToFahrenheit(1000)).toBe(1832);
      });

      it('converts very large positive numbers', () => {
        expect(celsiusToFahrenheit(10000)).toBe(18032);
      });
    });

    describe('Edge Cases - Decimal precision', () => {
      it('converts 25.5°C to 77.9°F', () => {
        expect(celsiusToFahrenheit(25.5)).toBe(77.9);
      });

      it('converts -40.5°C to -40.9°F', () => {
        expect(celsiusToFahrenheit(-40.5)).toBeCloseTo(-40.9, 1);
      });
    });
  });

  describe('fahrenheitToCelsius', () => {
    describe('Happy Flow - Standard conversions', () => {
      it('converts 32°F to 0°C (freezing point of water)', () => {
        expect(fahrenheitToCelsius(32)).toBe(0);
      });

      it('converts 212°F to 100°C (boiling point of water)', () => {
        expect(fahrenheitToCelsius(212)).toBe(100);
      });

      it('converts 98.6°F to 37°C (body temperature)', () => {
        expect(fahrenheitToCelsius(98.6)).toBeCloseTo(37, 5);
      });

      it('converts 68°F to 20°C (room temperature)', () => {
        expect(fahrenheitToCelsius(68)).toBe(20);
      });

      it('converts -40°F to -40°C (special point where C = F)', () => {
        expect(fahrenheitToCelsius(-40)).toBe(-40);
      });
    });

    describe('Edge Cases - Negative temperatures', () => {
      it('converts 14°F to -10°C', () => {
        expect(fahrenheitToCelsius(14)).toBe(-10);
      });

      it('converts -459.67°F to -273.15°C (absolute zero)', () => {
        expect(fahrenheitToCelsius(-459.67)).toBeCloseTo(-273.15, 2);
      });
    });
  });

  describe('celsiusToKelvin', () => {
    describe('Happy Flow - Standard conversions', () => {
      it('converts 0°C to 273.15K (freezing point of water)', () => {
        expect(celsiusToKelvin(0)).toBe(273.15);
      });

      it('converts 100°C to 373.15K (boiling point of water)', () => {
        expect(celsiusToKelvin(100)).toBe(373.15);
      });

      it('converts 20°C to 293.15K (room temperature)', () => {
        expect(celsiusToKelvin(20)).toBe(293.15);
      });

      it('converts 37°C to 310.15K (body temperature)', () => {
        expect(celsiusToKelvin(37)).toBe(310.15);
      });
    });

    describe('Edge Cases - Absolute zero', () => {
      it('converts -273.15°C to 0K (absolute zero)', () => {
        expect(celsiusToKelvin(-273.15)).toBe(0);
      });

      it('converts -273.16°C to very small negative (below absolute zero)', () => {
        expect(celsiusToKelvin(-273.16)).toBeLessThan(0);
      });
    });
  });

  describe('kelvinToCelsius', () => {
    describe('Happy Flow - Standard conversions', () => {
      it('converts 273.15K to 0°C (freezing point of water)', () => {
        expect(kelvinToCelsius(273.15)).toBe(0);
      });

      it('converts 373.15K to 100°C (boiling point of water)', () => {
        expect(kelvinToCelsius(373.15)).toBe(100);
      });

      it('converts 293.15K to 20°C (room temperature)', () => {
        expect(kelvinToCelsius(293.15)).toBe(20);
      });

      it('converts 310.15K to 37°C (body temperature)', () => {
        expect(kelvinToCelsius(310.15)).toBe(37);
      });
    });

    describe('Edge Cases - Absolute zero', () => {
      it('converts 0K to -273.15°C (absolute zero)', () => {
        expect(kelvinToCelsius(0)).toBe(-273.15);
      });

      it('converts very small positive Kelvin to very low Celsius', () => {
        expect(kelvinToCelsius(0.001)).toBeCloseTo(-273.149, 2);
      });
    });
  });

  describe('celsiusToRankine', () => {
    describe('Happy Flow - Standard conversions', () => {
      it('converts 0°C to 491.67°R (freezing point of water)', () => {
        expect(celsiusToRankine(0)).toBeCloseTo(491.67, 2);
      });

      it('converts 100°C to 671.67°R (boiling point of water)', () => {
        expect(celsiusToRankine(100)).toBeCloseTo(671.67, 2);
      });

      it('converts 20°C to 527.67°R', () => {
        expect(celsiusToRankine(20)).toBeCloseTo(527.67, 2);
      });

      it('converts 37°C to 558.27°R (body temperature)', () => {
        expect(celsiusToRankine(37)).toBeCloseTo(558.27, 2);
      });
    });

    describe('Edge Cases - Absolute zero', () => {
      it('converts -273.15°C to 0°R (absolute zero)', () => {
        expect(celsiusToRankine(-273.15)).toBe(0);
      });
    });
  });

  describe('rankineToCelsius', () => {
    describe('Happy Flow - Standard conversions', () => {
      it('converts 491.67°R to 0°C (freezing point of water)', () => {
        expect(rankineToCelsius(491.67)).toBeCloseTo(0, 0);
      });

      it('converts 671.67°R to 100°C (boiling point of water)', () => {
        expect(rankineToCelsius(671.67)).toBeCloseTo(100, 0);
      });

      it('converts 527.67°R to 20°C', () => {
        expect(rankineToCelsius(527.67)).toBeCloseTo(20, 0);
      });

      it('converts 558.27°R to 37°C (body temperature)', () => {
        expect(rankineToCelsius(558.27)).toBeCloseTo(37, 1);
      });
    });

    describe('Edge Cases - Absolute zero', () => {
      it('converts 0°R to -273.15°C (absolute zero)', () => {
        expect(rankineToCelsius(0)).toBe(-273.15);
      });
    });
  });

  describe('formatTemperature', () => {
    it('rounds to 2 decimal places', () => {
      expect(formatTemperature(25.567)).toBe(25.57);
    });

    it('rounds negative numbers correctly', () => {
      expect(formatTemperature(-40.009)).toBe(-40.01);
    });

    it('keeps whole numbers without decimals', () => {
      expect(formatTemperature(100)).toBe(100);
    });

    it('handles very small decimal differences', () => {
      expect(formatTemperature(98.6)).toBe(98.6);
    });

    it('handles zero', () => {
      expect(formatTemperature(0)).toBe(0);
    });
  });

  describe('Integration - Convert 25°C to all scales', () => {
    it('converts 25°C to 77°F', () => {
      expect(celsiusToFahrenheit(25)).toBe(77);
    });

    it('converts 25°C to 298.15K', () => {
      expect(celsiusToKelvin(25)).toBe(298.15);
    });

    it('converts 25°C to 536.67°R', () => {
      expect(celsiusToRankine(25)).toBeCloseTo(536.67, 2);
    });
  });

  describe('Round-trip conversions', () => {
    it('Celsius -> Fahrenheit -> Celsius returns original', () => {
      const original = 25;
      const fahrenheit = celsiusToFahrenheit(original);
      const result = fahrenheitToCelsius(fahrenheit);
      expect(result).toBeCloseTo(original, 5);
    });

    it('Celsius -> Kelvin -> Celsius returns original', () => {
      const original = 100;
      const kelvin = celsiusToKelvin(original);
      const result = kelvinToCelsius(kelvin);
      expect(result).toBeCloseTo(original, 5);
    });

    it('Celsius -> Rankine -> Celsius returns original', () => {
      const original = 0;
      const rankine = celsiusToRankine(original);
      const result = rankineToCelsius(rankine);
      expect(result).toBeCloseTo(original, 2);
    });

    it('handles negative Celsius -> Kelvin -> Celsius', () => {
      const original = -100;
      const kelvin = celsiusToKelvin(original);
      const result = kelvinToCelsius(kelvin);
      expect(result).toBeCloseTo(original, 5);
    });
  });
});