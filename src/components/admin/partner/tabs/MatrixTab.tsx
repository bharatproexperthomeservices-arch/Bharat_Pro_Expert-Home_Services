import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import type {
  MatrixItem,
  PartnerMatrixCompliance,
} from '../../../../types/partner';

import {
  fetchMatrix,
  fetchPartnerMatrixCompliance,
} from '../../../../services/partnerApi';

/* ============================================================
   MANDATORY CHEMICAL & TOOL MATRIX TAB
   - Category-wise matrix setup (with starter seed data)
   - Partner compliance view
   ============================================================ */

export interface MatrixTabProps {
  apiBase?: string;
  authToken?: string | null;
  categoryId?: string;
  partnerId?: string;
  onPartnerSelect?: (partnerId: string) => void;
}

type ViewMode = 'setup' | 'compliance';

/* ============================================================
   STARTER PACKS — editable seed configuration
   These are DEFAULTS. API response (if present) overrides them.
   ============================================================ */

export interface CategoryPack {
  id: string;
  name: string;
  emoji: string;
  risk: 'NORMAL' | 'ELEVATED';
  safetyNotes: string[];
  ppe: string[];
  items: StarterItem[];
}

export interface StarterItem {
  id: string;
  type: 'CHEMICAL' | 'TOOL' | 'MACHINE' | 'PPE' | 'CONSUMABLE';
  name: string;
  specification?: string;
  mandatory: boolean;
  supply_mode: 'PARTNER_OWNED' | 'COMPANY_ISSUED' | 'EITHER';
  min_quantity: number;
  unit: string;
  inspection_interval_days?: number;
  on_missing: 'BLOCK_CATEGORY' | 'WARN';
}

export const STARTER_PACKS: CategoryPack[] = [
  /* ---------------- HOME / DEEP CLEANING ---------------- */
  {
    id: 'home-deep',
    name: 'Home / Deep Cleaning',
    emoji: '🏠',
    risk: 'NORMAL',
    safetyNotes: [
      'Top-to-bottom sequence follow karein',
      'Surface compatibility check karein',
      'Dilution ratio SOP ke hisaab se',
      'Customer property ka care karein',
    ],
    ppe: ['Gloves', 'Safety shoes'],
    items: [
      { id: 'hd-1', type: 'TOOL', name: 'Microfiber cloths', specification: 'Different colors per zone', mandatory: true, supply_mode: 'EITHER', min_quantity: 6, unit: 'pcs', inspection_interval_days: 30, on_missing: 'WARN' },
      { id: 'hd-2', type: 'TOOL', name: 'Scrub pads & brushes', specification: 'Soft + hard bristle', mandatory: true, supply_mode: 'EITHER', min_quantity: 3, unit: 'pcs', inspection_interval_days: 30, on_missing: 'WARN' },
      { id: 'hd-3', type: 'TOOL', name: 'Mop & bucket', specification: 'Two-bucket method', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'set', inspection_interval_days: 60, on_missing: 'BLOCK_CATEGORY' },
      { id: 'hd-4', type: 'MACHINE', name: 'Wet-dry vacuum', specification: 'Min 1000W', mandatory: false, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'hd-5', type: 'TOOL', name: 'Extendable duster', specification: 'Fan / ceiling reach', mandatory: true, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 30, on_missing: 'WARN' },
      { id: 'hd-6', type: 'TOOL', name: 'Squeegee', specification: 'Glass / window', mandatory: true, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 30, on_missing: 'WARN' },
      { id: 'hd-7', type: 'TOOL', name: 'Safe step-stool', specification: 'Anti-slip', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'hd-8', type: 'CHEMICAL', name: 'All-purpose cleaner', specification: 'pH-neutral', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'L', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'hd-9', type: 'CHEMICAL', name: 'Neutral floor cleaner', specification: 'All floor types', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'L', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'hd-10', type: 'CHEMICAL', name: 'Glass cleaner', specification: 'Ammonia-free preferred', mandatory: true, supply_mode: 'EITHER', min_quantity: 500, unit: 'ml', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'hd-11', type: 'CHEMICAL', name: 'Degreaser', specification: 'Kitchen slab / chimney', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 500, unit: 'ml', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'hd-12', type: 'CHEMICAL', name: 'Disinfectant', specification: 'Phenyl / Dettol-type', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'L', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'hd-13', type: 'CHEMICAL', name: 'Furniture polish', specification: 'Wood-safe', mandatory: false, supply_mode: 'EITHER', min_quantity: 250, unit: 'ml', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'hd-14', type: 'PPE', name: 'Rubber gloves', specification: 'Chemical-resistant', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'pair', inspection_interval_days: 30, on_missing: 'BLOCK_CATEGORY' },
      { id: 'hd-15', type: 'PPE', name: 'Safety shoes', specification: 'Anti-slip', mandatory: true, supply_mode: 'PARTNER_OWNED', min_quantity: 1, unit: 'pair', inspection_interval_days: 180, on_missing: 'WARN' },
    ],
  },

  /* ---------------- BATHROOM CLEANING ---------------- */
  {
    id: 'bathroom',
    name: 'Bathroom Cleaning',
    emoji: '🚿',
    risk: 'ELEVATED',
    safetyNotes: [
      'BLEACH + ACID = TOXIC GAS — KABHI MAT MILAO',
      'BLEACH + AMMONIA = TOXIC — KABHI MAT MILAO',
      'Ventilation (exhaust fan) ON rakhein',
      'Gloves, mask, goggles zaroori',
      'Wet floor sign lagayein — slip safety',
    ],
    ppe: ['Gloves', 'Mask', 'Goggles', 'Apron', 'Safety shoes'],
    items: [
      { id: 'bt-1', type: 'TOOL', name: 'Bowl brush', specification: 'Toilet only', mandatory: true, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 30, on_missing: 'BLOCK_CATEGORY' },
      { id: 'bt-2', type: 'TOOL', name: 'Grout brush', specification: 'Small bristle', mandatory: true, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 30, on_missing: 'BLOCK_CATEGORY' },
      { id: 'bt-3', type: 'TOOL', name: 'Scrub brushes', specification: 'Small + medium', mandatory: true, supply_mode: 'EITHER', min_quantity: 2, unit: 'pcs', inspection_interval_days: 30, on_missing: 'WARN' },
      { id: 'bt-4', type: 'TOOL', name: 'Squeegee', specification: 'Glass / mirror', mandatory: true, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 30, on_missing: 'WARN' },
      { id: 'bt-5', type: 'TOOL', name: 'Microfiber cloths', specification: 'Bathroom-dedicated', mandatory: true, supply_mode: 'EITHER', min_quantity: 4, unit: 'pcs', inspection_interval_days: 30, on_missing: 'WARN' },
      { id: 'bt-6', type: 'CHEMICAL', name: 'Bathroom descaler', specification: 'Acid-based (hard water)', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 500, unit: 'ml', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'bt-7', type: 'CHEMICAL', name: 'Toilet cleaner', specification: 'HCl-based', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 500, unit: 'ml', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'bt-8', type: 'CHEMICAL', name: 'Disinfectant', specification: 'Bathroom-grade', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'L', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'bt-9', type: 'CHEMICAL', name: 'Tile cleaner', specification: 'Floor + wall', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'L', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'bt-10', type: 'CHEMICAL', name: 'Glass cleaner', specification: 'Ammonia-free', mandatory: true, supply_mode: 'EITHER', min_quantity: 500, unit: 'ml', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'bt-11', type: 'PPE', name: 'Rubber gloves', specification: 'Chemical-resistant', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'pair', inspection_interval_days: 30, on_missing: 'BLOCK_CATEGORY' },
      { id: 'bt-12', type: 'PPE', name: 'Safety goggles', specification: 'Splash protection', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'bt-13', type: 'PPE', name: 'Face mask', specification: 'N95 or better', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'box', inspection_interval_days: 30, on_missing: 'WARN' },
      { id: 'bt-14', type: 'PPE', name: 'Apron', specification: 'Water-resistant', mandatory: false, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'bt-15', type: 'CONSUMABLE', name: 'Wet-floor sign', specification: 'Caution board', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
    ],
  },

  /* ---------------- KITCHEN CLEANING ---------------- */
  {
    id: 'kitchen',
    name: 'Kitchen Cleaning',
    emoji: '🍳',
    risk: 'NORMAL',
    safetyNotes: [
      'Gas stove pehle band karein, thanda hone dein',
      'Food-contact surfaces pe koi residue na chhodein',
      'Chimney filter alag se clean karein',
      'Hob burners alag se saaf karein',
    ],
    ppe: ['Gloves', 'Apron', 'Safety shoes'],
    items: [
      { id: 'kt-1', type: 'TOOL', name: 'Scrapers', specification: 'Chimney / hob safe', mandatory: true, supply_mode: 'EITHER', min_quantity: 2, unit: 'pcs', inspection_interval_days: 60, on_missing: 'WARN' },
      { id: 'kt-2', type: 'TOOL', name: 'Degreasing brushes', specification: 'Stiff bristle', mandatory: true, supply_mode: 'EITHER', min_quantity: 2, unit: 'pcs', inspection_interval_days: 30, on_missing: 'BLOCK_CATEGORY' },
      { id: 'kt-3', type: 'TOOL', name: 'Microfiber cloths', specification: 'Kitchen-dedicated', mandatory: true, supply_mode: 'EITHER', min_quantity: 4, unit: 'pcs', inspection_interval_days: 30, on_missing: 'WARN' },
      { id: 'kt-4', type: 'MACHINE', name: 'Wet-dry vacuum', specification: 'Min 1000W', mandatory: false, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'kt-5', type: 'TOOL', name: 'Steel scrubber', specification: 'Chimney-safe', mandatory: true, supply_mode: 'EITHER', min_quantity: 2, unit: 'pcs', inspection_interval_days: 15, on_missing: 'WARN' },
      { id: 'kt-6', type: 'TOOL', name: 'Spray bottle', specification: '500ml', mandatory: true, supply_mode: 'EITHER', min_quantity: 2, unit: 'pcs', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'kt-7', type: 'CHEMICAL', name: 'Alkaline degreaser', specification: 'Heavy-duty', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'L', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'kt-8', type: 'CHEMICAL', name: 'Food-safe sanitizer', specification: 'FSSAI approved', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 500, unit: 'ml', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'kt-9', type: 'CHEMICAL', name: 'Stainless steel cleaner', specification: 'Non-abrasive', mandatory: true, supply_mode: 'EITHER', min_quantity: 250, unit: 'ml', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'kt-10', type: 'CHEMICAL', name: 'Oven cleaner', specification: 'Caustic-based', mandatory: false, supply_mode: 'COMPANY_ISSUED', min_quantity: 500, unit: 'ml', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'kt-11', type: 'CHEMICAL', name: 'Floor degreaser', specification: 'Kitchen floor', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'L', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'kt-12', type: 'PPE', name: 'Rubber gloves', specification: 'Chemical-resistant', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'pair', inspection_interval_days: 30, on_missing: 'BLOCK_CATEGORY' },
      { id: 'kt-13', type: 'PPE', name: 'Apron', specification: 'Water-resistant', mandatory: true, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'WARN' },
    ],
  },

  /* ---------------- SOFA CLEANING ---------------- */
  {
    id: 'sofa',
    name: 'Sofa Cleaning',
    emoji: '🛋️',
    risk: 'NORMAL',
    safetyNotes: [
      'Fabric identification pehle — fabric ya leather?',
      'Patch test zaroor karein (hidden area)',
      'Colour-fastness check karein',
      'Over-wetting avoid — drying time badhta hai',
    ],
    ppe: ['Gloves', 'Apron'],
    items: [
      { id: 'sf-1', type: 'TOOL', name: 'Upholstery vacuum', specification: 'Soft brush attachment', mandatory: true, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'sf-2', type: 'TOOL', name: 'Soft brushes', specification: 'Fabric-safe', mandatory: true, supply_mode: 'EITHER', min_quantity: 2, unit: 'pcs', inspection_interval_days: 30, on_missing: 'WARN' },
      { id: 'sf-3', type: 'MACHINE', name: 'Extraction machine', specification: 'Wet method', mandatory: true, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'sf-4', type: 'TOOL', name: 'Microfiber cloths', specification: 'Soft', mandatory: true, supply_mode: 'EITHER', min_quantity: 4, unit: 'pcs', inspection_interval_days: 30, on_missing: 'WARN' },
      { id: 'sf-5', type: 'TOOL', name: 'Spray bottles', specification: '500ml', mandatory: true, supply_mode: 'EITHER', min_quantity: 2, unit: 'pcs', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'sf-6', type: 'MACHINE', name: 'Air mover', specification: 'Drying (optional)', mandatory: false, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'sf-7', type: 'CHEMICAL', name: 'Upholstery shampoo', specification: 'Fabric-safe, pH-neutral', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'L', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'sf-8', type: 'CHEMICAL', name: 'Spot remover', specification: 'Multi-stain', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 500, unit: 'ml', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'sf-9', type: 'CHEMICAL', name: 'Deodoriser', specification: 'Fabric-safe', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 500, unit: 'ml', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'sf-10', type: 'CHEMICAL', name: 'Leather conditioner', specification: 'Leather sofa only', mandatory: false, supply_mode: 'COMPANY_ISSUED', min_quantity: 250, unit: 'ml', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'sf-11', type: 'PPE', name: 'Rubber gloves', specification: 'Chemical-resistant', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'pair', inspection_interval_days: 30, on_missing: 'BLOCK_CATEGORY' },
      { id: 'sf-12', type: 'PPE', name: 'Apron', specification: 'Water-resistant', mandatory: true, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'WARN' },
    ],
  },

  /* ---------------- CARPET CLEANING ---------------- */
  {
    id: 'carpet',
    name: 'Carpet Cleaning',
    emoji: '🧶',
    risk: 'NORMAL',
    safetyNotes: [
      'Pile type aur backing check karein',
      'Colour-fastness test karein',
      'Over-wetting = damage — avoid',
      'Drying time 4-6 hours minimum',
    ],
    ppe: ['Gloves', 'Mask', 'Apron'],
    items: [
      { id: 'cp-1', type: 'MACHINE', name: 'Vacuum', specification: 'Strong suction', mandatory: true, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'cp-2', type: 'TOOL', name: 'Agitation brush', specification: 'Carpet-safe', mandatory: true, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 60, on_missing: 'BLOCK_CATEGORY' },
      { id: 'cp-3', type: 'MACHINE', name: 'Extraction machine', specification: 'Hot-water', mandatory: true, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'cp-4', type: 'MACHINE', name: 'Air mover', specification: 'Drying (optional)', mandatory: false, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'cp-5', type: 'CHEMICAL', name: 'Carpet shampoo', specification: 'Low-residue', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'L', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'cp-6', type: 'CHEMICAL', name: 'Pre-spray', specification: 'Pre-treatment', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'L', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'cp-7', type: 'CHEMICAL', name: 'Spot lifter', specification: 'Stubborn stains', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 500, unit: 'ml', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'cp-8', type: 'CHEMICAL', name: 'Defoamer', specification: 'Machine protection', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 250, unit: 'ml', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'cp-9', type: 'PPE', name: 'Rubber gloves', specification: 'Chemical-resistant', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'pair', inspection_interval_days: 30, on_missing: 'BLOCK_CATEGORY' },
      { id: 'cp-10', type: 'PPE', name: 'Face mask', specification: 'Dust protection', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'box', inspection_interval_days: 30, on_missing: 'WARN' },
      { id: 'cp-11', type: 'PPE', name: 'Apron', specification: 'Water-resistant', mandatory: true, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'WARN' },
    ],
  },

  /* ---------------- FLOOR CLEANING ---------------- */
  {
    id: 'floor',
    name: 'Floor Cleaning',
    emoji: '🧹',
    risk: 'NORMAL',
    safetyNotes: [
      'Floor type pehle identify karein — marble / vitrified / tile / wood',
      'Marble pe acid KABHI mat lagayein (etching hoga)',
      'Wet floor signs zaroor lagayein',
      'Slip hazard avoid karein',
    ],
    ppe: ['Gloves', 'Mask', 'Safety shoes'],
    items: [
      { id: 'fl-1', type: 'TOOL', name: 'Dry mop', specification: 'Dust removal', mandatory: true, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 30, on_missing: 'WARN' },
      { id: 'fl-2', type: 'TOOL', name: 'Wet mop', specification: 'Floor type specific', mandatory: true, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 30, on_missing: 'BLOCK_CATEGORY' },
      { id: 'fl-3', type: 'TOOL', name: 'Scrubber', specification: 'Medium bristle', mandatory: true, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 60, on_missing: 'WARN' },
      { id: 'fl-4', type: 'MACHINE', name: 'Wet vacuum', specification: 'Optional', mandatory: false, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'fl-5', type: 'CONSUMABLE', name: 'Wet-floor signs', specification: 'Caution board', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 2, unit: 'pcs', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'fl-6', type: 'CHEMICAL', name: 'pH-neutral floor cleaner', specification: 'Marble / vitrified / tile', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 2, unit: 'L', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'fl-7', type: 'CHEMICAL', name: 'Grout cleaner', specification: 'Tile joints', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 500, unit: 'ml', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'fl-8', type: 'CHEMICAL', name: 'Stain remover', specification: 'Floor-type specific', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 500, unit: 'ml', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'fl-9', type: 'CHEMICAL', name: 'Wood floor cleaner', specification: 'Wood-safe (no water)', mandatory: false, supply_mode: 'COMPANY_ISSUED', min_quantity: 500, unit: 'ml', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'fl-10', type: 'CHEMICAL', name: 'Marble polish', specification: 'Marble only', mandatory: false, supply_mode: 'COMPANY_ISSUED', min_quantity: 500, unit: 'ml', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'fl-11', type: 'PPE', name: 'Rubber gloves', specification: 'Chemical-resistant', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'pair', inspection_interval_days: 30, on_missing: 'BLOCK_CATEGORY' },
      { id: 'fl-12', type: 'PPE', name: 'Safety shoes', specification: 'Anti-slip', mandatory: true, supply_mode: 'PARTNER_OWNED', min_quantity: 1, unit: 'pair', inspection_interval_days: 180, on_missing: 'WARN' },
    ],
  },

  /* ---------------- SINGLE-DISC MACHINE CLEANING ---------------- */
  {
    id: 'single-disc',
    name: 'Single-Disc Machine Cleaning',
    emoji: '⚙️',
    risk: 'ELEVATED',
    safetyNotes: [
      'OPERATOR CERTIFICATION ZAROORI',
      'Electrical safety — RCD-protected lead mandatory',
      'Pad selection by floor type',
      'Cord management (trip hazard)',
      'Water control (excess water = slip)',
    ],
    ppe: ['Gloves', 'Mask', 'Goggles', 'Apron', 'Safety shoes'],
    items: [
      { id: 'sd-1', type: 'MACHINE', name: 'Single-disc scrubbing machine', specification: 'Correct drive board', mandatory: true, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'sd-2', type: 'CONSUMABLE', name: 'Machine pads', specification: 'By floor type (multiple)', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 3, unit: 'pcs', inspection_interval_days: 30, on_missing: 'BLOCK_CATEGORY' },
      { id: 'sd-3', type: 'TOOL', name: 'Drive board', specification: 'Correct size', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'sd-4', type: 'MACHINE', name: 'Wet vacuum', specification: 'Required', mandatory: true, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'sd-5', type: 'TOOL', name: 'RCD-protected extension lead', specification: 'Mandatory for electrical safety', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'pc', inspection_interval_days: 60, on_missing: 'BLOCK_CATEGORY' },
      { id: 'sd-6', type: 'CONSUMABLE', name: 'Wet-floor signs', specification: 'Caution board', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 2, unit: 'pcs', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'sd-7', type: 'CHEMICAL', name: 'Floor stripper', specification: 'Old polish removal', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 2, unit: 'L', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'sd-8', type: 'CHEMICAL', name: 'Machine-compatible cleaner', specification: 'Per SOP', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 2, unit: 'L', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'sd-9', type: 'CHEMICAL', name: 'Neutral sealer', specification: 'Polish base', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'L', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'sd-10', type: 'CHEMICAL', name: 'Floor finish / polish', specification: 'Final coat', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'L', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'sd-11', type: 'PPE', name: 'Rubber gloves', specification: 'Chemical-resistant', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'pair', inspection_interval_days: 30, on_missing: 'BLOCK_CATEGORY' },
      { id: 'sd-12', type: 'PPE', name: 'Safety goggles', specification: 'Splash protection', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'sd-13', type: 'PPE', name: 'Face mask', specification: 'Fume protection', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'box', inspection_interval_days: 30, on_missing: 'WARN' },
      { id: 'sd-14', type: 'PPE', name: 'Apron', specification: 'Water-resistant', mandatory: true, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'sd-15', type: 'PPE', name: 'Safety shoes', specification: 'Anti-slip', mandatory: true, supply_mode: 'PARTNER_OWNED', min_quantity: 1, unit: 'pair', inspection_interval_days: 180, on_missing: 'BLOCK_CATEGORY' },
    ],
  },

  /* ---------------- SHAMPOO / EXTRACTION CLEANING ---------------- */
  {
    id: 'shampoo-extraction',
    name: 'Shampoo / Extraction Cleaning',
    emoji: '💧',
    risk: 'NORMAL',
    safetyNotes: [
      'Water temperature limits per fabric (check SOP)',
      'Residue rinse zaroori — warna sticky',
      'Drying time control',
      'Machine maintenance daily',
    ],
    ppe: ['Gloves', 'Mask', 'Goggles', 'Apron', 'Safety shoes'],
    items: [
      { id: 'se-1', type: 'MACHINE', name: 'Hot-water extraction machine', specification: 'Per SOP', mandatory: true, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'se-2', type: 'MACHINE', name: 'Low-moisture machine', specification: 'Optional', mandatory: false, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'se-3', type: 'TOOL', name: 'Upholstery tools', specification: 'For machine', mandatory: true, supply_mode: 'EITHER', min_quantity: 1, unit: 'set', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'se-4', type: 'TOOL', name: 'Carpet tools', specification: 'For machine', mandatory: true, supply_mode: 'EITHER', min_quantity: 1, unit: 'set', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'se-5', type: 'MACHINE', name: 'Vacuum', specification: 'Pre-clean', mandatory: true, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'se-6', type: 'MACHINE', name: 'Air movers', specification: 'Drying', mandatory: false, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'se-7', type: 'CHEMICAL', name: 'Extraction detergent', specification: 'Low-residue', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 2, unit: 'L', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'se-8', type: 'CHEMICAL', name: 'Shampoo (pre-spray)', specification: 'Fabric-safe', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'L', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'se-9', type: 'CHEMICAL', name: 'Defoamer', specification: 'Machine protection', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 250, unit: 'ml', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'se-10', type: 'CHEMICAL', name: 'Spot treatment', specification: 'Multi-stain', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 500, unit: 'ml', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'se-11', type: 'PPE', name: 'Rubber gloves', specification: 'Chemical-resistant', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'pair', inspection_interval_days: 30, on_missing: 'BLOCK_CATEGORY' },
      { id: 'se-12', type: 'PPE', name: 'Face mask', specification: 'Dust / fume', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'box', inspection_interval_days: 30, on_missing: 'WARN' },
      { id: 'se-13', type: 'PPE', name: 'Safety goggles', specification: 'Splash protection', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'se-14', type: 'PPE', name: 'Apron', specification: 'Water-resistant', mandatory: true, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'se-15', type: 'PPE', name: 'Safety shoes', specification: 'Anti-slip', mandatory: true, supply_mode: 'PARTNER_OWNED', min_quantity: 1, unit: 'pair', inspection_interval_days: 180, on_missing: 'WARN' },
    ],
  },

  /* ---------------- CHIMNEY CLEANING ---------------- */
  {
    id: 'chimney',
    name: 'Chimney Cleaning',
    emoji: '🏭',
    risk: 'ELEVATED',
    safetyNotes: [
      'Gas / power supply OFF karein',
      'Chimney thanda hone dein',
      'Filter alag se nikal ke clean karein',
      'Heavy degreaser — gloves + mask zaroori',
    ],
    ppe: ['Gloves', 'Mask', 'Goggles', 'Apron'],
    items: [
      { id: 'ch-1', type: 'TOOL', name: 'Steel scraper', specification: 'Chimney-safe', mandatory: true, supply_mode: 'EITHER', min_quantity: 2, unit: 'pcs', inspection_interval_days: 60, on_missing: 'BLOCK_CATEGORY' },
      { id: 'ch-2', type: 'TOOL', name: 'Stiff brushes', specification: 'Metal-safe', mandatory: true, supply_mode: 'EITHER', min_quantity: 2, unit: 'pcs', inspection_interval_days: 30, on_missing: 'BLOCK_CATEGORY' },
      { id: 'ch-3', type: 'MACHINE', name: 'Steam cleaner', specification: 'Optional', mandatory: false, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'ch-4', type: 'CHEMICAL', name: 'Heavy-duty alkaline degreaser', specification: 'Chimney-grade', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 2, unit: 'L', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'ch-5', type: 'CHEMICAL', name: 'Stainless steel cleaner', specification: 'Non-abrasive', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 500, unit: 'ml', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'ch-6', type: 'PPE', name: 'Rubber gloves', specification: 'Heavy-duty', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'pair', inspection_interval_days: 30, on_missing: 'BLOCK_CATEGORY' },
      { id: 'ch-7', type: 'PPE', name: 'Face mask', specification: 'N95 or better', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'box', inspection_interval_days: 30, on_missing: 'BLOCK_CATEGORY' },
      { id: 'ch-8', type: 'PPE', name: 'Safety goggles', specification: 'Splash protection', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'ch-9', type: 'PPE', name: 'Apron', specification: 'Water-resistant', mandatory: true, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'WARN' },
    ],
  },

  /* ---------------- MATTRESS CLEANING ---------------- */
  {
    id: 'mattress',
    name: 'Mattress Cleaning',
    emoji: '🛏️',
    risk: 'NORMAL',
    safetyNotes: [
      'Fabric identification karein',
      'UV-C sterilizer safety — aankh band rakhein',
      'Drying time 4-6 hours',
      'Chemical residue avoid',
    ],
    ppe: ['Gloves', 'Mask'],
    items: [
      { id: 'mt-1', type: 'MACHINE', name: 'Upholstery vacuum', specification: 'Soft brush', mandatory: true, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'mt-2', type: 'MACHINE', name: 'UV-C sterilizer', specification: 'Mattress-safe', mandatory: false, supply_mode: 'EITHER', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'mt-3', type: 'CHEMICAL', name: 'Upholstery shampoo', specification: 'Fabric-safe', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'L', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'mt-4', type: 'CHEMICAL', name: 'Deodoriser', specification: 'Fabric-safe', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 500, unit: 'ml', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'mt-5', type: 'PPE', name: 'Rubber gloves', specification: 'Chemical-resistant', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'pair', inspection_interval_days: 30, on_missing: 'BLOCK_CATEGORY' },
      { id: 'mt-6', type: 'PPE', name: 'Face mask', specification: 'Dust protection', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'box', inspection_interval_days: 30, on_missing: 'WARN' },
    ],
  },

  /* ---------------- WATER TANK CLEANING ---------------- */
  {
    id: 'water-tank',
    name: 'Water Tank Cleaning',
    emoji: '💦',
    risk: 'ELEVATED',
    safetyNotes: [
      'Food-grade chlorine only (municipal approved)',
      'Entry safety — harness / rope zaroori',
      'Proper ventilation before entry',
      'Post-clean flush 100% karein',
    ],
    ppe: ['Gloves', 'Mask', 'Goggles', 'Apron', 'Safety shoes', 'Harness'],
    items: [
      { id: 'wt-1', type: 'TOOL', name: 'Tank brush', specification: 'Long handle', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 2, unit: 'pcs', inspection_interval_days: 60, on_missing: 'BLOCK_CATEGORY' },
      { id: 'wt-2', type: 'TOOL', name: 'Telescopic brush', specification: 'Deep tank', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'pc', inspection_interval_days: 60, on_missing: 'WARN' },
      { id: 'wt-3', type: 'CHEMICAL', name: 'Food-grade chlorine', specification: 'Municipal approved', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'L', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'wt-4', type: 'PPE', name: 'Full PPE kit', specification: 'Gloves + mask + goggles + apron + shoes', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'set', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'wt-5', type: 'PPE', name: 'Safety harness', specification: 'Entry safety', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
    ],
  },

  /* ---------------- PEST CONTROL ---------------- */
  {
    id: 'pest-control',
    name: 'Pest Control',
    emoji: '🐜',
    risk: 'ELEVATED',
    safetyNotes: [
      'Government-approved pesticides only',
      'Licensed operator zaroori',
      'Customer ko evacuation notice dein',
      'Re-entry time batayein (usually 4-6 hours)',
    ],
    ppe: ['Gloves', 'Mask', 'Goggles', 'Apron', 'Safety shoes', 'Respirator'],
    items: [
      { id: 'pc-1', type: 'TOOL', name: 'Sprayer', specification: 'Pressure sprayer', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'pc-2', type: 'TOOL', name: 'Injector', specification: 'Termite injection', mandatory: false, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'pc', inspection_interval_days: 90, on_missing: 'WARN' },
      { id: 'pc-3', type: 'CHEMICAL', name: 'Approved pesticide', specification: 'Government-approved list only', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'L', inspection_interval_days: 60, on_missing: 'BLOCK_CATEGORY' },
      { id: 'pc-4', type: 'PPE', name: 'Respirator', specification: 'Chemical-grade', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'pc', inspection_interval_days: 60, on_missing: 'BLOCK_CATEGORY' },
      { id: 'pc-5', type: 'PPE', name: 'Full PPE kit', specification: 'Gloves + goggles + apron + shoes', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 1, unit: 'set', inspection_interval_days: 90, on_missing: 'BLOCK_CATEGORY' },
      { id: 'pc-6', type: 'CONSUMABLE', name: 'Warning signage', specification: 'Post-treatment', mandatory: true, supply_mode: 'COMPANY_ISSUED', min_quantity: 5, unit: 'pcs', inspection_interval_days: 90, on_missing: 'WARN' },
    ],
  },
];

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function MatrixTab({
  apiBase,
  authToken = null,
  categoryId,
  partnerId,
}: MatrixTabProps) {
  const [view, setView] = useState<ViewMode>('setup');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categoryId ?? STARTER_PACKS[0].id
  );
  const [apiItems, setApiItems] = useState<MatrixItem[] | null>(null);
  const [compliance, setCompliance] = useState<PartnerMatrixCompliance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState<string | null>(null);

  const apiOpts = useMemo(
    () => ({ baseUrl: apiBase, authToken }),
    [apiBase, authToken]
  );

  const selectedPack = useMemo(
    () => STARTER_PACKS.find((p) => p.id === selectedCategoryId),
    [selectedCategoryId]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotConfigured(null);
    try {
      if (view === 'setup') {
        try {
          const data = await fetchMatrix(selectedCategoryId, apiOpts);
          setApiItems(data);
        } catch (e) {
          if (e instanceof Error && e.message === 'Not configured') {
            setApiItems(null);
            setNotConfigured(
              'Matrix API not configured yet — showing starter seed data.'
            );
          } else {
            throw e;
          }
        }
      } else {
        if (!partnerId) {
          setCompliance([]);
          setNotConfigured('Select a partner to view compliance.');
          return;
        }
        const data = await fetchPartnerMatrixCompliance(
          partnerId,
          selectedCategoryId,
          apiOpts
        );
        setCompliance(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [view, selectedCategoryId, partnerId, apiOpts]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedCategoryId, partnerId]);

  const itemsToRender: StarterItem[] =
    apiItems && apiItems.length > 0
      ? apiItems.map((it) => ({
          id: it.id,
          type: it.type,
          name: it.name,
          specification: it.specification,
          mandatory: it.mandatory,
          supply_mode: it.supply_mode,
          min_quantity: it.min_quantity,
          unit: it.unit,
          inspection_interval_days: it.inspection_interval_days,
          on_missing: it.on_missing,
        }))
      : selectedPack?.items ?? [];

  return (
    <div style={styles.root}>
      <div style={styles.viewBar}>
        <button
          style={view === 'setup' ? styles.viewBtnActive : styles.viewBtn}
          onClick={() => setView('setup')}
        >
          Matrix Setup (by category)
        </button>
        <button
          style={view === 'compliance' ? styles.viewBtnActive : styles.viewBtn}
          onClick={() => setView('compliance')}
        >
          Partner Compliance
        </button>
        <button style={styles.refreshBtn} onClick={load} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      <div style={styles.categoryBar}>
        {STARTER_PACKS.map((p) => (
          <button
            key={p.id}
            style={
              selectedCategoryId === p.id
                ? styles.categoryBtnActive
                : styles.categoryBtn
            }
            onClick={() => setSelectedCategoryId(p.id)}
          >
            <span style={{ marginRight: 6 }}>{p.emoji}</span>
            {p.name}
            {p.risk === 'ELEVATED' && (
              <span style={styles.riskBadge}>RISK</span>
            )}
          </button>
        ))}
      </div>

      {notConfigured && (
        <div style={styles.infoBanner}>
          <strong>Note:</strong> {notConfigured}
        </div>
      )}

      {error && (
        <div style={styles.errorBanner}>
          <span>Error: {error}</span>
          <button style={styles.retryBtn} onClick={load}>
            Retry
          </button>
        </div>
      )}

      {view === 'setup' && selectedPack && (
        <MatrixSetupView
          pack={selectedPack}
          items={itemsToRender}
          usingApi={Boolean(apiItems && apiItems.length > 0)}
        />
      )}

      {view === 'compliance' && (
        <ComplianceView items={compliance} loading={loading} />
      )}
    </div>
  );
}

/* -------------------- View 1: Setup -------------------- */

function MatrixSetupView({
  pack,
  items,
  usingApi,
}: {
  pack: CategoryPack;
  items: StarterItem[];
  usingApi: boolean;
}) {
  const mandatoryCount = items.filter((i) => i.mandatory).length;

  return (
    <div>
      <div style={styles.packHeader}>
        <div>
          <div style={styles.packTitle}>
            {pack.emoji} {pack.name}
          </div>
          <div style={styles.packSub}>
            {items.length} items · {mandatoryCount} mandatory ·{' '}
            {usingApi ? 'Live from API' : 'Starter seed data (editable)'}
          </div>
        </div>
        {pack.risk === 'ELEVATED' && (
          <div style={styles.riskPill}>ELEVATED RISK</div>
        )}
      </div>

      {pack.safetyNotes.length > 0 && (
        <div style={styles.safetyBox}>
          <div style={styles.safetyTitle}>Safety Notes</div>
          <ul style={styles.safetyList}>
            {pack.safetyNotes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <Th>Type</Th>
              <Th>Name</Th>
              <Th>Specification</Th>
              <Th>Mandatory</Th>
              <Th>Supply Mode</Th>
              <Th>Min Qty</Th>
              <Th>Inspection</Th>
              <Th>On Missing</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <Td>
                  <span style={styles.typeChip}>{it.type}</span>
                </Td>
                <Td>
                  <strong>{it.name}</strong>
                </Td>
                <Td>{it.specification ?? '—'}</Td>
                <Td>
                  {it.mandatory ? (
                    <span style={styles.mandatoryChip}>MANDATORY</span>
                  ) : (
                    <span style={styles.optionalChip}>Optional</span>
                  )}
                </Td>
                <Td>
                  <span style={styles.supplyChip}>{it.supply_mode}</span>
                </Td>
                <Td>
                  {it.min_quantity} {it.unit}
                </Td>
                <Td>
                  {it.inspection_interval_days
                    ? `${it.inspection_interval_days}d`
                    : '—'}
                </Td>
                <Td>
                  <span
                    style={
                      it.on_missing === 'BLOCK_CATEGORY'
                        ? styles.blockChip
                        : styles.warnChip
                    }
                  >
                    {it.on_missing === 'BLOCK_CATEGORY' ? 'BLOCK' : 'WARN'}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -------------------- View 2: Compliance -------------------- */

function ComplianceView({
  items,
  loading,
}: {
  items: PartnerMatrixCompliance[];
  loading: boolean;
}) {
  if (loading) return <div style={styles.state}>Loading compliance…</div>;
  if (items.length === 0) {
    return (
      <div style={styles.state}>
        <h3 style={{ margin: 0 }}>No compliance records</h3>
        <p style={{ margin: '8px 0 0', color: '#6b7280' }}>
          Select a partner and category to see item-level compliance.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <Th>Item</Th>
            <Th>Status</Th>
            <Th>Verified By</Th>
            <Th>Verified At</Th>
            <Th>Next Due</Th>
            <Th>Evidence</Th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id}>
              <Td>
                <strong>{it.item_name}</strong>
              </Td>
              <Td>
                <span style={complianceTone(it.status)}>{it.status}</span>
              </Td>
              <Td>{it.verified_by ?? '—'}</Td>
              <Td>{it.verified_at ?? '—'}</Td>
              <Td>{it.next_due ?? '—'}</Td>
              <Td>
                {it.evidence_media_id ? (
                  <span style={styles.evidenceChip}>Attached</span>
                ) : (
                  <span style={styles.noEvidenceChip}>Missing</span>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------- Helpers -------------------- */

function complianceTone(status: string) {
  switch (status) {
    case 'VERIFIED_OWNED':
    case 'ISSUED':
      return styles.successChip;
    case 'PENDING':
      return styles.warnChip;
    case 'MISSING':
    case 'DAMAGED':
    case 'EXPIRED':
      return styles.dangerChip;
    default:
      return styles.typeChip;
  }
}

function Th({ children }: { children: ReactNode }) {
  return <th style={styles.th}>{children}</th>;
}
function Td({ children }: { children: ReactNode }) {
  return <td style={styles.td}>{children}</td>;
}

/* -------------------- Styles -------------------- */

const styles: Record<string, CSSProperties> = {
  root: { padding: 4 },
  viewBar: {
    display: 'flex',
    gap: 8,
    marginBottom: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  viewBtn: {
    padding: '8px 14px',
    background: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    color: '#374151',
    fontWeight: 600,
  },
  viewBtnActive: {
    padding: '8px 14px',
    background: '#eff6ff',
    border: '1px solid #93c5fd',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    color: '#1d4ed8',
    fontWeight: 700,
  },
  refreshBtn: {
    marginLeft: 'auto',
    padding: '8px 14px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
  },
  categoryBar: {
    display: 'flex',
    gap: 6,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  categoryBtn: {
    padding: '7px 12px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 999,
    cursor: 'pointer',
    fontSize: 12,
    color: '#374151',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
  },
  categoryBtnActive: {
    padding: '7px 12px',
    background: '#111827',
    border: '1px solid #111827',
    borderRadius: 999,
    cursor: 'pointer',
    fontSize: 12,
    color: '#fff',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
  },
  riskBadge: {
    marginLeft: 6,
    fontSize: 9,
    background: '#dc2626',
    color: '#fff',
    padding: '1px 5px',
    borderRadius: 3,
    fontWeight: 800,
  },
  packHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
    flexWrap: 'wrap',
  },
  packTitle: { fontSize: 18, fontWeight: 700, color: '#111827' },
  packSub: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  riskPill: {
    background: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    padding: '6px 10px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 800,
  },
  safetyBox: {
    background: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  safetyTitle: {
    fontSize: 12,
    fontWeight: 800,
    color: '#92400e',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  safetyList: {
    margin: 0,
    paddingLeft: 20,
    fontSize: 13,
    color: '#78350f',
    lineHeight: 1.7,
  },
  infoBanner: {
    background: '#e0f2fe',
    color: '#075985',
    border: '1px solid #bae6fd',
    padding: '10px 14px',
    borderRadius: 6,
    marginBottom: 12,
    fontSize: 13,
  },
  errorBanner: {
    background: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    padding: '10px 14px',
    borderRadius: 6,
    marginBottom: 12,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 13,
  },
  retryBtn: {
    padding: '6px 12px',
    background: '#991b1b',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  state: {
    padding: 40,
    textAlign: 'center',
    border: '1px dashed #d1d5db',
    borderRadius: 10,
    background: '#fff',
    color: '#374151',
  },
  tableWrap: {
    background: '#fff',
    borderRadius: 10,
    border: '1px solid #e5e7eb',
    overflowX: 'auto',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    background: '#f3f4f6',
    borderBottom: '1px solid #e5e7eb',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: '#6b7280',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid #f3f4f6',
    verticalAlign: 'top',
  },
  typeChip: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#f3f4f6',
    color: '#374151',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 700,
  },
  mandatoryChip: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#fee2e2',
    color: '#991b1b',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
  },
  optionalChip: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#f3f4f6',
    color: '#6b7280',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
  },
  supplyChip: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#eff6ff',
    color: '#1d4ed8',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 700,
  },
  blockChip: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#fee2e2',
    color: '#991b1b',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
  },
  warnChip: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
  },
  successChip: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#dcfce7',
    color: '#166534',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
  },
  dangerChip: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#fee2e2',
    color: '#991b1b',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
  },
  evidenceChip: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#dcfce7',
    color: '#166534',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
  },
  noEvidenceChip: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
  },
};