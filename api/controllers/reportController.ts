import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { ApiResponse, MonthlyReport } from '../../shared/types.js';
import { generateMonthlyReport } from '../services/reportService.js';

export function getMonthlyReportHandler(req: AuthRequest, res: Response<ApiResponse<MonthlyReport>>) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        errors: ['未登录'],
      });
    }

    const { month } = req.query;
    const report = generateMonthlyReport(req.user.id, month as string);

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      errors: ['生成报告失败'],
    });
  }
}
