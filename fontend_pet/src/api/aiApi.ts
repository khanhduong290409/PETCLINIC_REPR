import { API_BASE_URL, getAuthHeaders } from './apiClient';

// ─── Types ───────────────────────────────────────────────────────────────────

export type Severity = 'URGENT' | 'SOON' | 'NORMAL';

export type Gender = 'MALE' | 'FEMALE';

export interface DiseaseResult {
  disease_code: string;
  disease_vi: string;
  probability: number;
  severity: Severity;
}

export interface AiPrediction {
  species: string;
  top_disease: string;
  top_disease_vi: string;
  confidence: number;
  severity: Severity;
  top3: DiseaseResult[];
  imputed_fields: string[];
  supported: boolean;
  message: string;
}

export interface SymptomItem {
  code: string;
  vi: string;
  group: string;
}

export interface SymptomGroup {
  code: string;
  vi: string;
}

export interface NumericDefaults {
  age: number;
  weight: number;
  temperature: number;
  heart_rate: number;
  duration_days: number;
}

export interface SpeciesInfo {
  code: string;
  vi: string;
  symptomCodes: string[];
  breeds: string[];
  diseaseCodes: string[];
  defaults: NumericDefaults;
}

export interface DiseaseInfo {
  code: string;
  vi: string;
  species: string;
  severity: Severity;
  description: string;
  advice: string[];
}

export interface SymptomsResponse {
  species: SpeciesInfo[];
  symptomGroups: SymptomGroup[];
  symptoms: SymptomItem[];
  diseases: DiseaseInfo[];
}

// Các ô không bắt buộc để null → ai_service tự điền theo dữ liệu của loài
export interface PredictRequest {
  species: string;
  symptom_codes: string[];
  breed: string | null;
  gender: Gender | null;
  age: number | null;
  weight: number | null;
  temperature: number | null;
  heart_rate: number | null;
  duration_days: number | null;
}

// Thông báo lỗi hiển thị thẳng cho người dùng
const SERVICE_UNAVAILABLE_MESSAGE = 'Dịch vụ AI đang khởi động hoặc tạm ngưng, vui lòng thử lại sau ít phút.';
const SESSION_EXPIRED_MESSAGE = 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.';
const INVALID_INPUT_MESSAGE = 'Thông tin nhập chưa hợp lệ, vui lòng kiểm tra lại các ô số (tuổi, cân nặng, nhiệt độ...).';
const GENERIC_ERROR_MESSAGE = 'Không thể phân tích lúc này, vui lòng thử lại.';

// ai_service trả lỗi 400 dạng {"detail": "..."} với nội dung tiếng Việt → hiện nguyên văn
async function readBadRequestMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body.detail === 'string') return body.detail;
  } catch {
    // Body không phải JSON → dùng thông báo chung
  }
  return INVALID_INPUT_MESSAGE;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const aiApi = {
  /** Lấy loài, triệu chứng, giống và thông tin bệnh mà model đã học */
  async getSymptoms(): Promise<SymptomsResponse> {
    const response = await fetch(`${API_BASE_URL}/ai/symptoms`);
    if (response.status === 503) throw new Error(SERVICE_UNAVAILABLE_MESSAGE);
    if (!response.ok) throw new Error(GENERIC_ERROR_MESSAGE);
    return response.json();
  },

  /** Dự đoán bệnh từ loài, triệu chứng và các thông tin tùy chọn */
  async predict(request: PredictRequest): Promise<AiPrediction> {
    const response = await fetch(`${API_BASE_URL}/ai/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(request),
    });
    if (response.status === 503) throw new Error(SERVICE_UNAVAILABLE_MESSAGE);
    if (response.status === 401 || response.status === 403) throw new Error(SESSION_EXPIRED_MESSAGE);
    if (response.status === 400) throw new Error(await readBadRequestMessage(response));
    // 422: FastAPI từ chối số ngoài khoảng hợp lệ
    if (response.status === 422) throw new Error(INVALID_INPUT_MESSAGE);
    if (!response.ok) throw new Error(GENERIC_ERROR_MESSAGE);
    return response.json();
  },
};
