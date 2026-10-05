import { z } from 'zod';

// 📞 Phone validation helper (Cameroon formats: 6XXXXXXXX or +237 6XXXXXXXX or standard 9-12 digits)
export const phoneRegex = /^(?:\+?237\s?)?[62]\d{8}$|^[+]?[\d\s-]{8,15}$/;
export const momoNumberRegex = /^(?:\+?237\s?)?6[5-9]\d{7}$|^6[5-9]\d{7}$|^\d{9}$/;

// 🔐 Authentication Schemas
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address (e.g., name@domain.com)'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters long'),
});

export const partnerRegisterStep1Schema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'Legal full name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(80, 'Name must not exceed 80 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please provide a valid work or personal email'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters long'),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .refine((val) => phoneRegex.test(val.replace(/\s+/g, '')), {
      message: 'Please enter a valid phone number (e.g., 670 123 456)',
    }),
});

export const partnerRegisterStep2Schema = z.object({
  zone: z.string().min(1, 'Please select an operating zone'),
  restaurantName: z.string().optional(),
  address: z.string().optional(),
  vehicleType: z.enum(['BIKE', 'CAR']).optional(),
}).superRefine((data, ctx) => {
  // If restaurant details are being validated
  if (data.restaurantName !== undefined && data.restaurantName.trim().length < 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Restaurant storefront name must be at least 2 characters',
      path: ['restaurantName'],
    });
  }
  if (data.address !== undefined && data.address.trim().length < 5) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please specify a detailed physical address (min 5 characters)',
      path: ['address'],
    });
  }
});

export const partnerRegisterStep3Schema = z.object({
  momoProvider: z.enum(['MTN', 'ORANGE'], {
    errorMap: () => ({ message: 'Select your payout provider (MTN or Orange)' }),
  }),
  momoNumber: z
    .string()
    .trim()
    .min(1, 'MoMo phone number is required')
    .refine((val) => momoNumberRegex.test(val.replace(/\s+/g, '')), {
      message: 'Enter a valid 9-digit Mobile Money number (e.g. 670 123 456)',
    }),
  momoAccountName: z
    .string()
    .trim()
    .min(1, 'Registered account holder name is required')
    .min(3, 'Name must match the official MoMo subscriber name'),
});

// 🌍 Zones Validation Schema
export const zoneFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Zone title is required')
    .min(3, 'Zone name must be at least 3 characters (e.g., Douala - Akwa)'),
  base_price: z
    .coerce
    .number({ invalid_type_error: 'Base price must be a valid number' })
    .min(300, 'Minimum delivery base fee is 300 XAF')
    .max(25000, 'Maximum delivery base fee is 25,000 XAF'),
  risk: z.enum(['Low', 'Medium', 'High']).default('Low'),
  is_active: z.boolean().default(true),
});

// 🍽️ Menu Item / Food Inventory Schema
export const menuItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Item name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(70, 'Item title is too long (max 70 chars)'),
  category: z
    .string()
    .trim()
    .min(1, 'Category is required (e.g., Grills, Soups, Drinks)'),
  price: z
    .coerce
    .number({ invalid_type_error: 'Price must be a valid number' })
    .min(100, 'Item price must be at least 100 XAF')
    .max(200000, 'Item price cannot exceed 200,000 XAF'),
  description: z
    .string()
    .trim()
    .max(250, 'Description cannot exceed 250 characters')
    .optional()
    .or(z.literal('')),
  image: z
    .string()
    .trim()
    .url('Must be a valid web URL (e.g., https://...)')
    .optional()
    .or(z.literal('')),
  is_available: z.boolean().default(true),
});

// 🏪 Restaurant Settings Schema
export const restaurantSettingsSchema = z.object({
  restaurant_name: z
    .string()
    .trim()
    .min(2, 'Restaurant name must be at least 2 characters'),
  phone: z
    .string()
    .trim()
    .min(1, 'Store contact phone is required')
    .refine((val) => phoneRegex.test(val.replace(/\s+/g, '')), {
      message: 'Please provide a valid contact phone number',
    }),
  address: z
    .string()
    .trim()
    .min(5, 'Physical address must be at least 5 characters'),
  zone_id: z.string().min(1, 'Please designate a primary delivery zone'),
  opening_time: z.string().min(1, 'Specify opening hours'),
  closing_time: z.string().min(1, 'Specify closing hours'),
  estimated_prep_time: z
    .coerce
    .number()
    .min(5, 'Minimum preparation time is 5 minutes')
    .max(120, 'Maximum preparation time is 120 minutes')
    .default(25),
  minimum_order: z
    .coerce
    .number()
    .min(0, 'Minimum order cannot be negative')
    .default(0),
});

// 💸 Payout Request Schema
export const payoutRequestSchema = z.object({
  amount: z
    .coerce
    .number({ invalid_type_error: 'Amount must be a numeric value' })
    .min(1000, 'Minimum payout amount is 1,000 XAF'),
  momoProvider: z.enum(['MTN', 'ORANGE'], {
    errorMap: () => ({ message: 'Please select a payout provider' }),
  }),
  momoNumber: z
    .string()
    .trim()
    .refine((val) => momoNumberRegex.test(val.replace(/\s+/g, '')), {
      message: 'Enter a valid 9-digit MoMo recipient number',
    }),
  notes: z.string().trim().max(100, 'Notes max 100 characters').optional(),
});

// ⚙️ Admin Platform Configuration Schema
export const platformSettingsSchema = z.object({
  platform_commission: z
    .coerce
    .number({ invalid_type_error: 'Commission must be a number' })
    .min(0, 'Commission cannot be negative')
    .max(100, 'Commission cannot exceed 100%'),
  rider_commission: z
    .coerce
    .number({ invalid_type_error: 'Rider commission must be a number' })
    .min(0, 'Commission cannot be negative')
    .max(100, 'Commission cannot exceed 100%'),
  base_delivery_fee: z
    .coerce
    .number()
    .min(0, 'Base delivery fee cannot be negative'),
  surge_multiplier: z
    .coerce
    .number()
    .min(1.0, 'Multiplier cannot be less than 1.0')
    .max(5.0, 'Maximum surge multiplier is 5.0'),
  support_phone: z
    .string()
    .trim()
    .refine((val) => !val || phoneRegex.test(val.replace(/\s+/g, '')), {
      message: 'Support phone must be valid',
    })
    .optional()
    .or(z.literal('')),
  support_email: z
    .string()
    .trim()
    .email('Please provide a valid support email address')
    .optional()
    .or(z.literal('')),
});

// 🏍️ Rider Management & Edit Schema
export const riderFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Rider name must be at least 2 characters'),
  phone: z
    .string()
    .trim()
    .refine((val) => phoneRegex.test(val.replace(/\s+/g, '')), {
      message: 'Invalid phone number format',
    }),
  vehicle_type: z.enum(['BIKE', 'CAR']),
  zone: z.string().min(1, 'Please assign an operating zone'),
  commission_rate: z
    .coerce
    .number()
    .min(0, 'Commission rate must be between 0 and 100%')
    .max(100, 'Commission rate must be between 0 and 100%'),
});

// 🎯 Delivery Handover OTP Schema
export const otpVerificationSchema = z.object({
  otp: z
    .string()
    .trim()
    .length(4, 'Handover OTP must be exactly 4 digits')
    .regex(/^\d{4}$/, 'OTP must contain numbers only'),
});

// 📢 Marketing Banner / Announcement Schema
export const contentBannerSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Banner headline must be at least 3 characters')
    .max(90, 'Headline is too long (max 90 chars)'),
  subtitle: z
    .string()
    .trim()
    .max(160, 'Subtitle cannot exceed 160 characters')
    .optional()
    .or(z.literal('')),
  color: z.string().default('#00B14F'),
  restaurant_id: z.string().optional().or(z.literal('')),
});

// 🏷️ Category Management Schema
export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Category name must be at least 2 characters')
    .max(50, 'Category name cannot exceed 50 characters'),
  icon: z.string().default('silverware-fork-knife'),
  color: z.string().default('#E0F2F1'),
  icon_color: z.string().default('#00695C'),
  sort_order: z
    .coerce
    .number()
    .min(0, 'Sort order cannot be negative')
    .default(0),
});

// 💬 Support Ticket Reply & Resolution Schema
export const supportTicketReplySchema = z.object({
  replyMessage: z
    .string()
    .trim()
    .min(5, 'Response message must be at least 5 characters')
    .max(500, 'Response message cannot exceed 500 characters'),
  status: z.enum(['Pending', 'In Progress', 'Resolved']).default('Resolved'),
  actionTaken: z.string().trim().optional().or(z.literal('')),
  refundAmount: z
    .coerce
    .number({ invalid_type_error: 'Refund must be a valid number' })
    .min(0, 'Refund cannot be negative')
    .max(50000, 'Max single compensation refund is 50,000 XAF')
    .optional()
    .or(z.literal('')),
});

// 💰 Individual Rider Payout Schema
export const individualPayoutSchema = z.object({
  amount: z
    .coerce
    .number({ invalid_type_error: 'Amount must be a numeric value' })
    .min(500, 'Minimum disbursement is 500 XAF'),
  paymentMethod: z.enum(['MTN_MOMO', 'ORANGE_MONEY', 'CASH']).default('MTN_MOMO'),
  referenceNote: z
    .string()
    .trim()
    .min(3, 'Payment reference / transaction ID is required (min 3 chars)')
    .max(80, 'Reference cannot exceed 80 characters'),
});

// 📊 Commission Rate Update Schema
export const commissionRateSchema = z.object({
  commission_rate: z
    .coerce
    .number({ invalid_type_error: 'Commission rate must be a valid percentage' })
    .min(0, 'Commission cannot be negative')
    .max(100, 'Commission rate cannot exceed 100%'),
});

// 🏪 Admin Restaurant Partner Schema (Add/Edit)
export const restaurantPartnerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Restaurant name must be at least 2 characters')
    .max(80, 'Name must not exceed 80 characters'),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .refine((val) => phoneRegex.test(val.replace(/\s+/g, '')), {
      message: 'Please provide a valid phone number (e.g. 670 123 456)',
    }),
  address: z
    .string()
    .trim()
    .min(5, 'Physical address must be at least 5 characters'),
  zone_id: z.string().min(1, 'Please designate a delivery zone'),
  commission_rate: z
    .coerce
    .number({ invalid_type_error: 'Commission rate must be a number' })
    .min(0, 'Commission cannot be negative')
    .max(100, 'Commission cannot exceed 100%')
    .default(20),
});

