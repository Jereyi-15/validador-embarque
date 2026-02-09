import { parseEmail } from '../parsers/emailParser';
import { validateShipment } from '../validators/shipmentValidator';
import { TransportMode, ServiceType, Incoterm } from '../types/shipment.types';

describe('Email Parser - Integration Tests', () => {
  describe('Complete shipments (no errors)', () => {
    it('should parse complete FCL email without errors', () => {
      const emailText = `Subject: Request quotation - Export FCL

Body:
Hi team,
Please quote for 1x40HC from San Jose, Costa Rica to Rotterdam, NL.
Commodity: canned food
Incoterm: FOB
Ready date: 2026-02-20
Gross weight: 18,500 kg
Volume: 58 cbm
Shipper: Alimentos Ticos S.A.
Consignee: Euro Imports BV`;

      const result = parseEmail(emailText, 'test-fcl.txt');
      validateShipment(result);

      // Verify all critical fields extracted
      expect(result.shipment.mode).toBe(TransportMode.OCEAN);
      expect(result.shipment.service).toBe(ServiceType.FCL);
      expect(result.shipment.incoterm).toBe(Incoterm.FOB);
      expect(result.shipment.origin.city).toBe('San Jose');
      expect(result.shipment.destination.city).toBe('Rotterdam');
      expect(result.shipment.parties.shipper).toBe('Alimentos Ticos S.A.');
      
      // No errors or warnings
      expect(result.validation.errors).toHaveLength(0);
      expect(result.validation.warnings).toHaveLength(0);
    });

    it('should parse complete air freight email without errors', () => {
      const emailText = `Subject: Urgent airfreight quote needed

Hello,
We need an air freight quote for the following shipment:

Route: from Miami, USA to Sao Paulo, Brazil
Commodity: Electronics - mobile phones
Incoterm: DDP
Ready date: 2026-02-15
Gross weight: 450 kg
Volume: 3.2 cbm
Shipper: Tech Solutions Inc.
Consignee: Brasil Electronics Ltda`;

      const result = parseEmail(emailText, 'test-air.txt');
      validateShipment(result);

      expect(result.shipment.mode).toBe(TransportMode.AIR);
      expect(result.shipment.service).toBe(ServiceType.AIR);
      expect(result.shipment.origin.city).toBe('Miami');
      expect(result.shipment.destination.city).toBe('Sao Paulo');
      
      // Complete and valid
      expect(result.validation.errors).toHaveLength(0);
      expect(result.validation.warnings).toHaveLength(0);
    });
  });

  describe('Incomplete shipments (with errors)', () => {
    it('should generate errors for incomplete email missing critical data', () => {
      const emailText = `Subject: Need shipping info

Hi,
Can you help me ship some cargo?

I need to send merchandise to London, UK.
Ready date: next week
Volume: 25 cbm

Please let me know the cost.`;

      const result = parseEmail(emailText, 'test-incomplete.txt');
      validateShipment(result);

      // Missing critical fields
      expect(result.shipment.origin.city).toBe('');
      expect(result.shipment.mode).toBe(TransportMode.UNKNOWN);
      expect(result.shipment.parties.shipper).toBe('');

      // Must have blocking errors
      expect(result.validation.errors.length).toBeGreaterThan(0);
      expect(result.validation.errors).toContain('Origin location is missing or incomplete');
      expect(result.validation.errors).toContain('Transport mode could not be determined');
      expect(result.validation.errors).toContain('Shipper information is missing');
    });

    it('should generate errors for shipment missing destination', () => {
      const emailText = `Subject: Partial shipment info

We need FCL shipment
Ready date: 2026-03-01
Gross weight: 10000 kg
Shipper: Export Company Ltd`;

      const result = parseEmail(emailText, 'test-no-destination.txt');
      validateShipment(result);

      // Has mode and shipper, but missing locations
      expect(result.shipment.mode).toBe(TransportMode.OCEAN);
      expect(result.shipment.parties.shipper).toBe('Export Company Ltd');
      expect(result.shipment.origin.city).toBe('');
      expect(result.shipment.destination.city).toBe('');

      // Must have errors for missing origin and destination
      expect(result.validation.errors).toContain('Origin location is missing or incomplete');
      expect(result.validation.errors).toContain('Destination location is missing or incomplete');
    });
  });

  describe('Shipment with relative date (warning)', () => {
    it('should parse relative date and generate warning', () => {
      const emailText = `Subject: LCL shipment - partial info

Team,
Please quote for LCL shipment:

From: Shanghai, China
To: Los Angeles, USA
Ready date: next week
Gross weight: 2,800 kg
Shipper: Dragon Exports Co.
Consignee: Pacific Imports LLC`;

      const result = parseEmail(emailText, 'test-relative-date.txt');
      validateShipment(result);

      // All critical fields present
      expect(result.shipment.mode).toBe(TransportMode.OCEAN);
      expect(result.shipment.origin.city).toBe('Shanghai');
      expect(result.shipment.destination.city).toBe('Los Angeles');
      expect(result.shipment.parties.shipper).toBe('Dragon Exports Co.');
      
      // Relative date detected
      expect(result.shipment.ready_date).toBe('next week');
      
      // No blocking errors, but warnings present
      expect(result.validation.errors).toHaveLength(0);
      expect(result.validation.warnings.length).toBeGreaterThan(0);
      expect(result.validation.warnings).toContain('Ready date is relative or unknown: "next week"');
    });
  });
});
