import { Router } from 'express';
import { getSchedules, getScheduleById, createSchedule, updateSchedule, deleteSchedule } from '../controllers/scheduleController.js';
import { authenticate } from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminOnly.js';
import { validate } from '../middleware/validate.js';
import { scheduleSchema } from '../validators/schemas.js';

const router = Router();

router.get('/', authenticate, getSchedules);
router.get('/:id', authenticate, getScheduleById);
router.post('/', authenticate, adminOnly, validate(scheduleSchema), createSchedule);
router.put('/:id', authenticate, adminOnly, validate(scheduleSchema), updateSchedule);
router.delete('/:id', authenticate, adminOnly, deleteSchedule);

export default router;
