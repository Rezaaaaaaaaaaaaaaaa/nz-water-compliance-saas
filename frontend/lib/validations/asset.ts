import { z } from 'zod';

export const assetSchema = z.object({
  name: z.string().min(1, 'Asset name is required'),
  type: z.enum([
    'WATER_SOURCE',
    'TREATMENT_PLANT',
    'RESERVOIR',
    'PUMP_STATION',
    'PIPE_NETWORK',
    'VALVE',
    'METER',
    'OTHER',
  ], { message: 'Please select an asset type' }),
  description: z.string().optional(),
  location: z.string().optional(),
  latitude: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= -90 && Number(val) <= 90), {
      message: 'Latitude must be between -90 and 90',
    }),
  longitude: z.string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= -180 && Number(val) <= 180), {
      message: 'Longitude must be between -180 and 180',
    }),
  installationDate: z.string().optional(),
  capacity: z.string()
    .optional()
    .refine((val) => !val || !isNaN(Number(val)), {
      message: 'Capacity must be a number',
    }),
  status: z.enum(['OPERATIONAL', 'MAINTENANCE', 'OFFLINE', 'DECOMMISSIONED']).optional(),
  condition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL']).optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  lastInspectionDate: z.string().optional(),
  nextInspectionDate: z.string().optional(),
});

export type AssetFormData = z.infer<typeof assetSchema>;
