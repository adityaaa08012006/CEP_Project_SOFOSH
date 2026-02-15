import { Router } from 'express';
import {
  getDonationItems,
  getDonationItemById,
  createDonationItem,
  updateDonationItem,
  deleteDonationItem,
  extractFromPdf,
  bulkCreateItems,
} from '../controllers/donationItemController.js';
import { authenticate } from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminOnly.js';
import { validate } from '../middleware/validate.js';
import { donationItemSchema, bulkDonationItemsSchema } from '../validators/schemas.js';
import { uploadPdf } from '../middleware/upload.js';

const router = Router();

router.get('/', authenticate, getDonationItems);
router.get('/:id', authenticate, getDonationItemById);
router.post('/', authenticate, adminOnly, validate(donationItemSchema), createDonationItem);
router.put('/:id', authenticate, adminOnly, validate(donationItemSchema), updateDonationItem);
router.delete('/:id', authenticate, adminOnly, deleteDonationItem);

// PDF extraction
router.post('/extract-from-pdf', authenticate, adminOnly, uploadPdf, extractFromPdf);
router.post('/bulk-create', authenticate, adminOnly, validate(bulkDonationItemsSchema), bulkCreateItems);

export default router;
