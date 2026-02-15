import { Router } from 'express';
import {
  getAppointments,
  getAppointmentById,
  bookAppointment,
  updateAppointmentStatus,
  cancelAppointment,
  getDailySummary,
} from '../controllers/appointmentController.js';
import { authenticate } from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminOnly.js';
import { validate } from '../middleware/validate.js';
import { appointmentSchema, appointmentStatusSchema } from '../validators/schemas.js';

const router = Router();

router.get('/', authenticate, getAppointments);
router.get('/daily-summary', authenticate, adminOnly, getDailySummary);
router.get('/:id', authenticate, getAppointmentById);
router.post('/', authenticate, validate(appointmentSchema), bookAppointment);
router.put('/:id/status', authenticate, adminOnly, validate(appointmentStatusSchema), updateAppointmentStatus);
router.put('/:id/cancel', authenticate, cancelAppointment);

export default router;
