
export enum AppState {
  INITIAL = 'INITIAL',
  CAPTURE = 'CAPTURE',
  SEGMENT = 'SEGMENT',
  RESULTS = 'RESULTS'
}

export interface AnalysisResult {
  bValue: number;
  prediction: JaundiceCategory;
  timestamp: number;
  imageUrl: string;
}

export enum JaundiceCategory {
  NORMAL = '正常範囲内',
  SUBCLINICAL = '潜在性高ビリルビン血症',
  OVERT = '顕在性黄疸'
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
