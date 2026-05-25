export interface KPIStats {
  totalDocs: number;
  pendingApprovals: number;
  processingTime: string;
  efficiency: number;
}

export interface LeaderDeptPerformance {
  name: string;
  value: number;
}