import { ROLES } from '@cep/shared';

export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
