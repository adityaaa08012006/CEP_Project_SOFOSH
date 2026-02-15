import { Router } from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/donationCategoryController.js';
import { authenticate } from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminOnly.js';
import { validate } from '../middleware/validate.js';
import { donationCategorySchema } from '../validators/schemas.js';

const router = Router();

router.get('/', authenticate, getCategories);
router.post('/', authenticate, adminOnly, validate(donationCategorySchema), createCategory);
router.put('/:id', authenticate, adminOnly, validate(donationCategorySchema), updateCategory);
router.delete('/:id', authenticate, adminOnly, deleteCategory);

export default router;
