import { Router } from 'express';
import { getDonations, createDonation, verifyDonation } from '../controllers/donationController.js';
import { authenticate } from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminOnly.js';
import { validate } from '../middleware/validate.js';
import { donationSchema } from '../validators/schemas.js';

const router = Router();

router.get('/', authenticate, getDonations);
router.post('/', authenticate, validate(donationSchema), createDonation);
router.put('/:id/verify', authenticate, adminOnly, verifyDonation);

export default router;
