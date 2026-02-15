import { Router } from 'express';
import { getInventory, updateInventory, getInventoryReport } from '../controllers/inventoryController.js';
import { authenticate } from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminOnly.js';
import { validate } from '../middleware/validate.js';
import { inventoryUpdateSchema } from '../validators/schemas.js';

const router = Router();

router.get('/', authenticate, getInventory);
router.get('/report', authenticate, adminOnly, getInventoryReport);
router.put('/:itemId', authenticate, adminOnly, validate(inventoryUpdateSchema), updateInventory);

export default router;
