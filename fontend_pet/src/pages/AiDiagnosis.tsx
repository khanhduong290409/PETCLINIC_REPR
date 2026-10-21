import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  ShieldAlert,
  Search,
  Check,
  X,
  Loader2,
  AlertTriangle,
  AlertCircle,
  ClipboardList,
  CalendarPlus,
  ChevronRight,
  RotateCcw,
  Activity,
  Info,
} from 'lucide-react';
import { aiApi } from '../api/aiApi';
import type {
  AiPrediction,
  DiseaseInfo,
  Gender,
  PredictRequest,
  Severity,
  SpeciesInfo,
  SymptomGroup,
  SymptomItem,
  SymptomsResponse,
} from '../api/aiApi';

// ─── Mức độ khẩn cấp ─────────────────────────────────────────────────────────

interface SeverityStyle {
  label: string;
  badgeClass: string;
}

// Tra cứu theo severity thay cho ternary lồng nhau
const SEVERITY_STYLE: Record<Severity, SeverityStyle> = {
  URGENT: { label: 'Cần khám ngay', badgeClass: 'bg-rose-50 text-rose-700 ring-rose-200' },
  SOON: { label: 'Nên khám sớm', badgeClass: 'bg-amber-50 text-amber-800 ring-amber-200' },
  NORMAL: { label: 'Theo dõi thêm', badgeClass: 'bg-slate-100 text-slate-700 ring-slate-200' },
};

// Xác suất top-1 dưới ngưỡng này → cảnh báo kết quả không đáng tin
const LOW_CONFIDENCE_THRESHOLD = 0.5;

// ─── Thông tin tùy chọn (không bắt buộc) ─────────────────────────────────────

// Giữ dạng chuỗi để ô trống phân biệt được với số 0
interface OptionalInfo {
  breed: string;
  gender: '' | Gender;
  age: string;
  weight: string;
  temperature: string;
  heartRate: string;
  durationDays: string;
}

const EMPTY_OPTIONAL_INFO: OptionalInfo = {
  breed: '',
  gender: '',
  age: '',
  weight: '',
  temperature: '',
  heartRate: '',
  durationDays: '',
};

// ─── Hàm tiện ích ────────────────────────────────────────────────────────────

function toPercent(probability: number): number {
  return Math.round(probability * 100);
}

// Ô trống → null để ai_service tự điền theo dữ liệu của loài
function parseOptionalNumber(text: string): number | null {
  if (text.trim() === '') return null;
  const value = Number(text);
  if (Number.isNaN(value)) return null;
  return value;
}

function emptyToNull(text: string): string | null {
  if (text === '') return null;
  return text;
}

// Bỏ dấu tiếng Việt để gõ "non" vẫn tìm ra "Nôn"
function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

// ─── Trang chính ─────────────────────────────────────────────────────────────

export default function AiDiagnosis() {
  const [catalog, setCatalog] = useState<SymptomsResponse | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [speciesCode, setSpeciesCode] = useState('');
  const [optionalInfo, setOptionalInfo] = useState<OptionalInfo>(EMPTY_OPTIONAL_INFO);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');

  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AiPrediction | null>(null);
  const [predictError, setPredictError] = useState('');

  const loadCatalog = async () => {
    setLoadingCatalog(true);
    setLoadError('');
    try {
      const data = await aiApi.getSymptoms();
      setCatalog(data);
    } catch (err) {
      if (err instanceof Error) {
        setLoadError(err.message);
      } else {
        setLoadError('Không tải được dữ liệu chẩn đoán.');
      }
    } finally {
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  // Mọi thay đổi đầu vào đều làm kết quả cũ hết đúng → xóa đi, bắt bấm Phân tích lại
  const clearResult = () => {
    setResult(null);
    setPredictError('');
  };

  // Đổi loài thì giống và triệu chứng đã chọn không còn hợp lệ
  const handleSelectSpecies = (code: string) => {
    if (code === speciesCode) return;
    setSpeciesCode(code);
    setOptionalInfo({ ...optionalInfo, breed: '' });
    setSelectedCodes([]);
    setSearchText('');
    clearResult();
  };

  const handleOptionalInfoChange = (field: keyof OptionalInfo, value: string) => {
    setOptionalInfo({ ...optionalInfo, [field]: value });
    clearResult();
  };

  const toggleSymptom = (code: string) => {
    if (selectedCodes.includes(code)) {
      setSelectedCodes(selectedCodes.filter((selected) => selected !== code));
    } else {
      setSelectedCodes([...selectedCodes, code]);
    }
    clearResult();
  };

  const handleClear = () => {
    setOptionalInfo(EMPTY_OPTIONAL_INFO);
    setSelectedCodes([]);
    clearResult();
  };

  const handleAnalyze = async () => {
    if (speciesCode === '' || selectedCodes.length === 0) return;

    let gender: Gender | null = null;
    if (optionalInfo.gender !== '') gender = optionalInfo.gender;

    const request: PredictRequest = {
      species: speciesCode,
      symptom_codes: selectedCodes,
      breed: emptyToNull(optionalInfo.breed),
      gender,
      age: parseOptionalNumber(optionalInfo.age),
      weight: parseOptionalNumber(optionalInfo.weight),
      temperature: parseOptionalNumber(optionalInfo.temperature),
      heart_rate: parseOptionalNumber(optionalInfo.heartRate),
      duration_days: parseOptionalNumber(optionalInfo.durationDays),
    };

    setAnalyzing(true);
    setPredictError('');
    try {
      const prediction = await aiApi.predict(request);
      setResult(prediction);
    } catch (err) {
      if (err instanceof Error) {
        setPredictError(err.message);
      } else {
        setPredictError('Không thể phân tích lúc này, vui lòng thử lại.');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Dữ liệu suy ra từ catalog ──
  const speciesList: SpeciesInfo[] = catalog ? catalog.species : [];
  const symptomGroups: SymptomGroup[] = catalog ? catalog.symptomGroups : [];
  const allSymptoms: SymptomItem[] = catalog ? catalog.symptoms : [];
  const allDiseases: DiseaseInfo[] = catalog ? catalog.diseases : [];

  let selectedSpecies: SpeciesInfo | null = null;
  for (const species of speciesList) {
    if (species.code === speciesCode) selectedSpecies = species;
  }

  // Bệnh của loài đang chọn, để liệt kê trong khung lưu ý
  const speciesDiseases: DiseaseInfo[] = [];
  if (selectedSpecies) {
    for (const disease of allDiseases) {
      if (disease.species === selectedSpecies.code) speciesDiseases.push(disease);
    }
  }

  // Tra tên tiếng Việt của triệu chứng đã chọn, theo đúng thứ tự người dùng chọn
  const selectedSymptoms: SymptomItem[] = [];
  for (const code of selectedCodes) {
    const symptom = allSymptoms.find((item) => item.code === code);
    if (symptom) selectedSymptoms.push(symptom);
  }

  // Chỉ hiện triệu chứng của loài đang chọn, lọc theo ô tìm kiếm, gom theo nhóm
  const keyword = normalizeText(searchText);
  const visibleGroups: { group: SymptomGroup; items: SymptomItem[] }[] = [];
  if (selectedSpecies) {
    const speciesSymptomCodes = selectedSpecies.symptomCodes;
    for (const group of symptomGroups) {
      const items = allSymptoms.filter((symptom) => {
        if (symptom.group !== group.code) return false;
        if (!speciesSymptomCodes.includes(symptom.code)) return false;
        if (keyword === '') return true;
        return normalizeText(symptom.vi).includes(keyword);
      });
      if (items.length > 0) visibleGroups.push({ group, items });
    }
  }

  const canAnalyze = speciesCode !== '' && selectedCodes.length > 0 && !analyzing;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ── Header ── */}
        <div className="rounded-2xl bg-cyan-800 px-6 py-7 md:px-8 mb-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex w-12 h-12 shrink-0 rounded-xl bg-white/10 ring-1 ring-white/20 items-center justify-center">
              <Stethoscope size={24} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-200">
                Công cụ hỗ trợ sàng lọc
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">Chẩn đoán sơ bộ bằng AI</h1>
              <p className="text-sm text-cyan-100 mt-2 max-w-3xl leading-relaxed">
                Chọn loài và các triệu chứng quan sát được, hệ thống sẽ gợi ý 3 bệnh có khả năng cao nhất bằng mô
                hình học máy Random Forest
                {catalog && (
                  <>
                    {' '}
                    — hỗ trợ {speciesList.length} loài, {allDiseases.length} bệnh
                  </>
                )}
                .
              </p>
            </div>
          </div>
        </div>

        {/* ── Lưu ý bắt buộc ── */}
        <div className="mb-6 rounded-xl border border-amber-200 border-l-4 border-l-amber-500 bg-amber-50/70 px-5 py-4">
          <div className="flex items-start gap-3">
            <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-amber-900">Lưu ý quan trọng trước khi sử dụng</h2>
              <ul className="list-disc pl-5 mt-2 space-y-1.5 text-sm text-amber-900/90 leading-relaxed">
                <li>
                  Kết quả do mô hình học máy đưa ra, <strong>chỉ mang tính tham khảo</strong> và không thay thế
                  chẩn đoán của bác sĩ thú y. Mô hình được huấn luyện từ dữ liệu ít, độ chính xác còn hạn chế — hãy
                  xem cả 3 khả năng, không chỉ khả năng cao nhất.
                </li>
                <li>
                  Mỗi loài chỉ nhận diện được <strong>một số bệnh nhất định</strong>. Các bệnh khác sẽ không được phát
                  hiện, kể cả khi thú nuôi đang mắc.
                </li>
                <li>
                  Nếu thú nuôi có dấu hiệu nguy kịch (khó thở nặng, co giật liên tục, bất tỉnh), hãy đưa đến phòng
                  khám ngay, không chờ kết quả.
                </li>
              </ul>
              {selectedSpecies && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-amber-900 mb-2">
                    {speciesDiseases.length} bệnh nhận diện được ở {selectedSpecies.vi.toLowerCase()}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {speciesDiseases.map((disease) => (
                      <span
                        key={disease.code}
                        className="text-xs font-medium text-amber-900 bg-white ring-1 ring-amber-200 px-2.5 py-1 rounded-md"
                      >
                        {disease.vi}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Nội dung chính ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Cột trái: nhập thông tin */}
          <section className="lg:col-span-3 bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm">
            <PanelHeader
              step={1}
              title="Thông tin thú nuôi và triệu chứng"
              subtitle="Chọn loài trước, sau đó chọn các dấu hiệu quan sát được gần đây"
            />

            <div className="p-6">
              <CatalogState loading={loadingCatalog} loadError={loadError} onRetry={loadCatalog} />

              {catalog && (
                <div className="space-y-6">
                  <SpeciesPicker species={speciesList} selectedCode={speciesCode} onSelect={handleSelectSpecies} />

                  {selectedSpecies && (
                    <>
                      <OptionalInfoForm
                        species={selectedSpecies}
                        info={optionalInfo}
                        onChange={handleOptionalInfoChange}
                      />

                      <div>
                        <p className="text-sm font-semibold text-slate-900 mb-3">
                          Triệu chứng <span className="text-rose-600">*</span>
                        </p>
                        <div className="relative mb-5">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder="Tìm triệu chứng, ví dụ: sốt, ho, tiêu chảy..."
                            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-700/30 focus:border-cyan-700"
                          />
                        </div>
                        <SymptomList visibleGroups={visibleGroups} selectedCodes={selectedCodes} onToggle={toggleSymptom} />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Thanh thao tác */}
            <div className="border-t border-slate-200 bg-slate-50/80 px-6 py-4 rounded-b-2xl">
              {selectedSymptoms.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {selectedSymptoms.map((symptom) => (
                    <span
                      key={symptom.code}
                      className="inline-flex items-center gap-1 text-xs font-medium text-cyan-900 bg-cyan-50 ring-1 ring-cyan-200 pl-2.5 pr-1 py-1 rounded-md"
                    >
                      {symptom.vi}
                      <button
                        type="button"
                        onClick={() => toggleSymptom(symptom.code)}
                        className="p-0.5 rounded hover:bg-cyan-100"
                        aria-label={`Bỏ chọn ${symptom.vi}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <p className="text-sm text-slate-600 sm:mr-auto">
                  Đã chọn <span className="font-semibold text-slate-900">{selectedCodes.length}</span> triệu chứng
                </p>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={analyzing}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RotateCcw size={15} /> Xóa lựa chọn
                </button>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!canAnalyze}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-cyan-800 text-white hover:bg-cyan-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
                  {analyzing ? 'Đang phân tích...' : 'Phân tích'}
                </button>
              </div>
            </div>
          </section>

          {/* Cột phải: kết quả */}
          <section className="lg:col-span-2 lg:sticky lg:top-20 bg-white rounded-2xl ring-1 ring-slate-200 shadow-sm">
            <PanelHeader step={2} title="Kết quả phân tích" subtitle="Ước lượng của mô hình, chỉ để tham khảo" />
            <div className="p-6">
              <ResultPanel
                analyzing={analyzing}
                predictError={predictError}
                result={result}
                diseases={allDiseases}
                hasSpecies={speciesCode !== ''}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ─── Các khối giao diện ──────────────────────────────────────────────────────

function PanelHeader({ step, title, subtitle }: { step: number; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200">
      <span className="w-7 h-7 shrink-0 rounded-full bg-cyan-800 text-white text-xs font-bold flex items-center justify-center">
        {step}
      </span>
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function CatalogState({ loading, loadError, onRetry }: { loading: boolean; loadError: string; onRetry: () => void }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
        <Loader2 size={18} className="animate-spin" /> Đang tải dữ liệu chẩn đoán...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center text-center py-10">
        <AlertCircle size={28} className="text-rose-500" />
        <p className="text-sm font-medium text-slate-800 mt-3">Không tải được dữ liệu chẩn đoán</p>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">{loadError}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
        >
          <RotateCcw size={15} /> Thử lại
        </button>
      </div>
    );
  }

  return null;
}

interface SpeciesPickerProps {
  species: SpeciesInfo[];
  selectedCode: string;
  onSelect: (code: string) => void;
}

function SpeciesPicker({ species, selectedCode, onSelect }: SpeciesPickerProps) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-900 mb-3">
        Loài <span className="text-rose-600">*</span>
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {species.map((item) => {
          let buttonClass = 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50';
          if (item.code === selectedCode) {
            buttonClass = 'border-cyan-700 bg-cyan-50 text-cyan-900 font-semibold';
          }
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => onSelect(item.code)}
              aria-pressed={item.code === selectedCode}
              className={`px-3 py-2.5 rounded-lg border text-sm transition-colors ${buttonClass}`}
            >
              {item.vi}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface OptionalInfoFormProps {
  species: SpeciesInfo;
  info: OptionalInfo;
  onChange: (field: keyof OptionalInfo, value: string) => void;
}

function OptionalInfoForm({ species, info, onChange }: OptionalInfoFormProps) {
  const inputClass =
    'w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-700/30 focus:border-cyan-700';
  const defaults = species.defaults;

  return (
    <div>
      <p className="text-sm font-semibold text-slate-900">Thông tin thêm</p>
      <p className="text-xs text-slate-500 mt-0.5 mb-3">
        Không bắt buộc. Ô để trống sẽ được điền theo giá trị phổ biến của loài trong dữ liệu huấn luyện.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Giống">
          <select value={info.breed} onChange={(e) => onChange('breed', e.target.value)} className={inputClass}>
            <option value="">Không rõ</option>
            {species.breeds.map((breed) => (
              <option key={breed} value={breed}>
                {breed}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Giới tính">
          <select value={info.gender} onChange={(e) => onChange('gender', e.target.value)} className={inputClass}>
            <option value="">Không rõ</option>
            <option value="MALE">Đực</option>
            <option value="FEMALE">Cái</option>
          </select>
        </Field>
        <Field label="Tuổi (năm)">
          <input
            type="number"
            min={0}
            step="any"
            value={info.age}
            onChange={(e) => onChange('age', e.target.value)}
            placeholder={`VD: ${defaults.age}`}
            className={inputClass}
          />
        </Field>
        <Field label="Cân nặng (kg)">
          <input
            type="number"
            min={0}
            step="any"
            value={info.weight}
            onChange={(e) => onChange('weight', e.target.value)}
            placeholder={`VD: ${defaults.weight}`}
            className={inputClass}
          />
        </Field>
        <Field label="Nhiệt độ cơ thể (°C)">
          <input
            type="number"
            step="0.1"
            value={info.temperature}
            onChange={(e) => onChange('temperature', e.target.value)}
            placeholder={`VD: ${defaults.temperature}`}
            className={inputClass}
          />
        </Field>
        <Field label="Nhịp tim (lần/phút)">
          <input
            type="number"
            min={0}
            value={info.heartRate}
            onChange={(e) => onChange('heartRate', e.target.value)}
            placeholder={`VD: ${defaults.heart_rate}`}
            className={inputClass}
          />
        </Field>
        <Field label="Số ngày có triệu chứng">
          <input
            type="number"
            min={0}
            value={info.durationDays}
            onChange={(e) => onChange('durationDays', e.target.value)}
            placeholder={`VD: ${defaults.duration_days}`}
            className={inputClass}
          />
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>
      {children}
    </label>
  );
}

interface SymptomListProps {
  visibleGroups: { group: SymptomGroup; items: SymptomItem[] }[];
  selectedCodes: string[];
  onToggle: (code: string) => void;
}

function SymptomList({ visibleGroups, selectedCodes, onToggle }: SymptomListProps) {
  if (visibleGroups.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-500">Không tìm thấy triệu chứng phù hợp.</p>;
  }

  return (
    <div className="space-y-5">
      {visibleGroups.map(({ group, items }) => (
        <div key={group.code}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">{group.vi}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {items.map((symptom) => (
              <SymptomOption
                key={symptom.code}
                label={symptom.vi}
                checked={selectedCodes.includes(symptom.code)}
                onClick={() => onToggle(symptom.code)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SymptomOption({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  let buttonClass = 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50';
  let boxClass = 'border-slate-300 bg-white';
  if (checked) {
    buttonClass = 'border-cyan-700 bg-cyan-50 text-cyan-900';
    boxClass = 'border-cyan-700 bg-cyan-700';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={checked}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left text-sm transition-colors ${buttonClass}`}
    >
      <span className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center ${boxClass}`}>
        {checked && <Check size={12} className="text-white" strokeWidth={3} />}
      </span>
      {label}
    </button>
  );
}

interface ResultPanelProps {
  analyzing: boolean;
  predictError: string;
  result: AiPrediction | null;
  diseases: DiseaseInfo[];
  hasSpecies: boolean;
}

function ResultPanel({ analyzing, predictError, result, diseases, hasSpecies }: ResultPanelProps) {
  if (analyzing) {
    return (
      <div className="flex flex-col items-center text-center py-14">
        <Loader2 size={28} className="animate-spin text-cyan-700" />
        <p className="text-sm text-slate-600 mt-3">Đang phân tích triệu chứng...</p>
      </div>
    );
  }

  if (predictError) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 flex items-start gap-3">
        <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
        <p className="text-sm text-rose-800">{predictError}</p>
      </div>
    );
  }

  if (!result) {
    let hint = 'Chọn ít nhất một triệu chứng rồi bấm Phân tích để xem kết quả.';
    if (!hasSpecies) hint = 'Chọn loài của thú nuôi để bắt đầu.';
    return (
      <div className="flex flex-col items-center text-center py-14">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
          <ClipboardList size={22} className="text-slate-400" />
        </div>
        <p className="text-sm text-slate-600 mt-3 max-w-xs">{hint}</p>
      </div>
    );
  }

  const topInfo = diseases.find((disease) => disease.code === result.top_disease);
  const severityStyle = SEVERITY_STYLE[result.severity] ?? SEVERITY_STYLE.NORMAL;
  const isLowConfidence = result.confidence < LOW_CONFIDENCE_THRESHOLD;

  return (
    <div>
      {/* Bệnh khả năng cao nhất */}
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Khả năng cao nhất</p>
      <div className="flex items-start justify-between gap-4 mt-1.5">
        <h3 className="text-xl font-bold text-slate-900 leading-snug">{result.top_disease_vi}</h3>
        <div className="text-right shrink-0">
          <p className="text-3xl font-bold text-cyan-800 tabular-nums leading-none">{toPercent(result.confidence)}%</p>
          <p className="text-[11px] text-slate-500 mt-1">xác suất</p>
        </div>
      </div>
      <span className={`inline-block mt-3 text-xs font-semibold px-2.5 py-1 rounded-md ring-1 ${severityStyle.badgeClass}`}>
        {severityStyle.label}
      </span>

      {isLowConfidence && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900 leading-relaxed">
            Triệu chứng chưa khớp rõ với một bệnh cụ thể của loài này — kết quả có độ tin cậy thấp. Hãy xem cả 3 khả
            năng bên dưới và nên đưa thú nuôi đi khám để bác sĩ kiểm tra trực tiếp.
          </p>
        </div>
      )}

      {result.imputed_fields.length > 0 && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 flex items-start gap-3">
          <Info size={16} className="text-slate-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed">
            Các thông tin bạn để trống đã được điền theo dữ liệu phổ biến của loài:{' '}
            {result.imputed_fields.join(', ')}. Nhập đủ thông tin giúp kết quả sát hơn.
          </p>
        </div>
      )}

      {topInfo && topInfo.description !== '' && (
        <div className="mt-5">
          <p className="text-sm text-slate-700 leading-relaxed">{topInfo.description}</p>
          <p className="text-sm font-semibold text-slate-900 mt-4 mb-2">Khuyến nghị</p>
          <ul className="space-y-2">
            {topInfo.advice.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed">
                <ChevronRight size={16} className="text-cyan-700 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Top 3 */}
      <div className="mt-6 pt-5 border-t border-slate-200">
        <p className="text-sm font-semibold text-slate-900 mb-3">Mức độ phù hợp — 3 khả năng cao nhất</p>
        <div className="space-y-3">
          {result.top3.map((disease, index) => (
            <ProbabilityBar
              key={disease.disease_code}
              name={disease.disease_vi}
              probability={disease.probability}
              highlighted={index === 0}
            />
          ))}
        </div>
      </div>

      <Link
        to="/book-appointment"
        className="mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-cyan-800 text-white hover:bg-cyan-900 transition-colors"
      >
        <CalendarPlus size={16} /> Đặt lịch khám với bác sĩ
      </Link>
      <p className="text-[11px] text-slate-500 text-center mt-3 leading-relaxed">
        Kết quả mang tính tham khảo, không thay thế chẩn đoán của bác sĩ thú y.
      </p>
    </div>
  );
}

function ProbabilityBar({ name, probability, highlighted }: { name: string; probability: number; highlighted: boolean }) {
  const percent = toPercent(probability);
  let nameClass = 'text-slate-600';
  let barClass = 'bg-slate-300';
  if (highlighted) {
    nameClass = 'font-semibold text-slate-900';
    barClass = 'bg-cyan-700';
  }

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className={nameClass}>{name}</span>
        <span className="tabular-nums text-slate-600">{percent}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
