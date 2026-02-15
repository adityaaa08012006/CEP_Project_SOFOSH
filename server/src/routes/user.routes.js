import { Router } from 'express';
import { getUsers, getUserById, updateUserRole, deleteUser } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminOnly.js';

const router = Router();

router.get('/', authenticate, adminOnly, getUsers);
router.get('/:id', authenticate, adminOnly, getUserById);
router.put('/:id/role', authenticate, adminOnly, updateUserRole);
router.delete('/:id', authenticate, adminOnly, deleteUser);

export default router;
