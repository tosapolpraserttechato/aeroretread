export interface RetreadData {
  MATERIAL?: string;
  SIZE?: string;
  CUSTOMER?: string;
  AIRLINE?: string;
  STAT?: string;
  [key: string]: any; // Allow for dynamic process columns
}

export interface ProcessInventoryCounts {
  name: string;
  fullName: string;
  C: number;
  R: number;
  I: number;
  T: number;
  J: number;
  H: number;
}
