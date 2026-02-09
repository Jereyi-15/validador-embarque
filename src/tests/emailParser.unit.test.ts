import {
  extractMode,
  extractService,
  extractRoute,
  extractContainers,
  extractWeight,
} from '../parsers/emailParser';
import { TransportMode, ServiceType } from '../types/shipment.types';

describe('Email Parser - Unit Tests', () => {
  describe('extractMode', () => {
    it('should detect OCEAN mode from FCL keyword', () => {
      expect(extractMode('Please quote for FCL shipment')).toBe(TransportMode.OCEAN);
    });

    it('should detect AIR mode from airfreight keyword', () => {
      expect(extractMode('urgent airfreight needed')).toBe(TransportMode.AIR);
    });

    it('should return UNKNOWN when no mode keywords found', () => {
      expect(extractMode('please send me a quote')).toBe(TransportMode.UNKNOWN);
    });
  });

  describe('extractService', () => {
    it('should extract FCL service type', () => {
      expect(extractService('Quote for FCL container')).toBe(ServiceType.FCL);
    });

    it('should extract LCL service type', () => {
      expect(extractService('We need LCL shipping')).toBe(ServiceType.LCL);
    });
  });

  describe('extractRoute', () => {
    it('should extract route from "from...to" pattern', () => {
      const text = 'from San Jose, Costa Rica to Rotterdam, NL';
      const result = extractRoute(text);
      
      expect(result.origin.city).toBe('San Jose');
      expect(result.origin.country).toBe('Costa Rica');
      expect(result.destination.city).toBe('Rotterdam');
      expect(result.destination.country).toBe('NL');
    });

    it('should return empty locations when no pattern matches', () => {
      const text = 'Please send quote';
      const result = extractRoute(text);
      
      expect(result.origin.city).toBe('');
      expect(result.destination.city).toBe('');
    });
  });

  describe('extractContainers', () => {
    it('should extract single container: 1x40HC', () => {
      const result = extractContainers('Quote for 1x40HC');
      
      expect(result).toHaveLength(1);
      expect(result[0].qty).toBe(1);
      expect(result[0].type).toBe('40HC');
    });

    it('should extract multiple container types', () => {
      const result = extractContainers('Need 2x40HC and 1x20ft');
      
      expect(result).toHaveLength(2);
      expect(result[0].qty).toBe(2);
      expect(result[0].type).toBe('40HC');
      expect(result[1].qty).toBe(1);
      expect(result[1].type).toBe('20');
    });
  });

  describe('extractWeight', () => {
    it('should extract weight with comma separator: 18,500 kg', () => {
      const result = extractWeight('Gross weight: 18,500 kg');
      expect(result).toBe(18500);
    });

    it('should return null when no weight found', () => {
      const result = extractWeight('No weight specified');
      expect(result).toBeNull();
    });
  });
});
