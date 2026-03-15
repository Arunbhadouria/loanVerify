export type RiskBand = 'low' | 'medium' | 'high'
export type ApplicationStatus =
  'pending' | 'under_review' | 'approved' | 'rejected' | 'more_info'
export type AssetType = 'property' | 'vehicle' | 'machinery' | 'land'
export type AssetCondition = 'excellent' | 'good' | 'fair' | 'poor'

export interface User {
  id: string
  phone: string
  full_name: string
  aadhaar_last4: string
  pan: string
  occupation: string
  monthly_income: number
  created_at: string
}

export interface Application {
  id: string
  user_id: string
  loan_amount: number
  loan_purpose: string
  status: ApplicationStatus
  credit_score: number
  risk_band: RiskBand
  collateral_value: number
  fraud_flags: string[]
  officer_notes: string
  approved_amount: number
  interest_rate: number
  created_at: string
  updated_at: string
  users?: User
  assets?: Asset[]
  documents?: Document[]
  ai_reports?: AIReport[]
}

export interface Asset {
  id: string
  application_id: string
  asset_type: AssetType
  asset_description: string
  estimated_value: number
  condition: AssetCondition
  location_lat: number
  location_lng: number
  location_address: string
}

export interface Document {
  id: string
  application_id: string
  asset_id: string
  doc_type: string
  file_url: string
  gps_lat: number
  gps_lng: number
  captured_at: string
  is_verified: boolean
  fraud_flag: string
}

export interface AIReport {
  id: string
  application_id: string
  score_explanation: string
  collateral_narrative: string
  full_report: string
  improvement_suggestions: string
}