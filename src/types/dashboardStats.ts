export interface DriversSummaryData {
  delivery: number;
  company: number;
  total: number;
}

export interface SubscriptionGroupSummary {
  basic: number;
  classic: number;
  premium: number;
  expired: number;
  total: number;
}

export interface SubscriptionsSummaryData {
  companies: SubscriptionGroupSummary;
  individuals: SubscriptionGroupSummary;
}

