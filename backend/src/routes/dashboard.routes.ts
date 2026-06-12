import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/authenticate'
import { getKPIs } from '../controllers/dashboard.controller'

const router = Router()

router.get(
  '/kpis',
  authenticate,
  authorize(['admin']),
  getKPIs
)

export default router