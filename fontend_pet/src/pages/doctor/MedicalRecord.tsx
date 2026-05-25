import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect, useRef, useState } from "react";
import { medicalRecordApi, type MedicalRequest, type MedicalResponse } from "../../api/medicalRecordApi";
import { petApi } from "../../api/petApi";
import { useToast } from '../../contexts/ToastContext';

import {
  ArrowLeft,
  Camera,
  X,
  Stethoscope,
  ClipboardList,
  Pill,
  FileText,
  CalendarCheck,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Save,
  PawPrint,
} from "lucide-react";


const DEFAULT_PET_IMAGES: Record<string, string> = {
  DOG: '/assets/default-dog.svg',
  CAT: '/assets/default-cat.svg',
  BIRD: '/assets/default-bird.svg',
  RABBIT: '/assets/default-rabbit.svg',
  HAMSTER: '/assets/default-hamster.svg',
  OTHER: '/assets/default-pet.svg',
};

const SPECIES_MAP: Record<string, string> = {
  DOG: 'Chó',
  CAT: 'Mèo',
  BIRD: 'Chim',
  RABBIT: 'Thỏ',
  HAMSTER: 'Hamster',
  OTHER: 'Khác',
};

const MAX_IMAGES = 10;
const MAX_FILE_SIZE_MB = 5;

// Mỗi ảnh có thể là URL đã upload (đã có server URL) hoặc file chưa upload (giữ preview dataURL)
type RecordImage = {
  url?: string;         // URL trên Cloudinary nếu đã upload
  file?: File;          // File chưa upload — sẽ upload khi bấm Lưu
  previewUrl: string;   // URL để render (url hoặc dataURL)
};

export default function MedicalRecord() {
    const { user } = useAuth();
    const { bookingCode } = useParams();

    const [records, setRecords ] = useState<MedicalResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [forms, setForms] = useState<Record<number, MedicalRequest>>({});
    const [saved, setSaved] = useState<Record<number, boolean>>({});
    const [saving, setSaving] = useState<number | null> (null);

    // State ảnh: list ảnh hiện tại của từng record (cả đã upload và chưa)
    const [images, setImages] = useState<Record<number, RecordImage[]>>({});
    const [imageErrors, setImageErrors] = useState<Record<number, string>>({});
    const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
    const { showToast } = useToast();


    useEffect(() => {
        loadRecords();
    }, [user]);


    const loadRecords = async () => {
        try {
            setLoading(true);
            const data = await medicalRecordApi.getRecord(bookingCode ?? '');
            setRecords(data);
            const initialForms: Record<number, MedicalRequest> = {};
            const initialImages: Record<number, RecordImage[]> = {};
            for ( const r of data) {
                initialForms[r.appointmentId] = {
                    diagnosis: r.diagnosis ?? '',
                    treatment: r.treatment ?? '',
                    prescription: r.prescription ?? '',
                    notes: r.notes ?? '',
                    followUpDate: r.followUpDate ?? '',
                    imageUrls: r.imageUrls ?? []
                };
                initialImages[r.appointmentId] = (r.imageUrls ?? []).map(url => ({ url, previewUrl: url }));
            }
            setForms(initialForms);
            setImages(initialImages); // sau for nó sẽ tạo ra 1 record mà với mỗi id appointment = > list object gồm 2 value (url và previewUrl)

        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    const updateField = (appointmentId: number, field: keyof MedicalRequest, value : string) => {
      const currentForm = forms[appointmentId];
      const formUpdate = {...currentForm, [field] : value};
      setForms({...forms, [appointmentId] : formUpdate});
      setSaved(prev => ({ ...prev, [appointmentId] : false}));
    };

    const readFileAsDataURL = (file: File): Promise<string> =>
      new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

    const handleFileChange = async (appointmentId: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      const input = fileInputRefs.current[appointmentId];

      if (files.length === 0) return;

      const current = images[appointmentId] ?? [];
      const slots = MAX_IMAGES - current.length;
      const toAdd = files.slice(0, slots);
      const skipped = files.length - toAdd.length;

      const valid = toAdd.filter(f => {
        if (!f.type.startsWith('image/')) {
          setImageErrors(prev => ({ ...prev, [appointmentId]: `"${f.name}" không phải ảnh — bỏ qua` }));
          return false;
        }
        if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          setImageErrors(prev => ({ ...prev, [appointmentId]: `"${f.name}" > ${MAX_FILE_SIZE_MB}MB — bỏ qua` }));
          return false;
        }
        return true;
      });

      if (valid.length === 0) {
        if (input) input.value = '';
        return;
      }

      const newItems: RecordImage[] = await Promise.all(
        valid.map(async file => ({ file, previewUrl: await readFileAsDataURL(file) }))
      );

      setImages(prev => ({
        ...prev,
        [appointmentId]: (prev[appointmentId] ?? []).concat(newItems)
      }));
      setSaved(prev => ({ ...prev, [appointmentId]: false }));
      setImageErrors(prev => ({
        ...prev,
        [appointmentId]: skipped > 0 ? `Đã bỏ qua ${skipped} ảnh vì vượt giới hạn ${MAX_IMAGES}` : ''
      }));

      if (input) input.value = '';
    };

    const removeImage = (appointmentId: number, index: number) => {
      setImages(prev => ({
        ...prev,
        [appointmentId]: (prev[appointmentId] ?? []).filter((_, i) => i !== index)
      }));
      setSaved(prev => ({ ...prev, [appointmentId]: false }));
    };


    const handleSave = async (appointmentId : number)  => {
      try {
        setSaving(appointmentId);

        // Upload tất cả file chưa upload (song song), giữ thứ tự
        const list = images[appointmentId] ?? [];
        const finalUrls = await Promise.all(
          list.map(item => item.url ? Promise.resolve(item.url) : petApi.uploadImage(item.file!))
        );

        const payload: MedicalRequest = { ...forms[appointmentId], imageUrls: finalUrls };
        await medicalRecordApi.saveRecord(appointmentId, payload);

        // Sync state — đánh dấu tất cả ảnh đã upload (chuyển file → url)
        setForms(prev => ({ ...prev, [appointmentId]: payload }));
        setImages(prev => ({
          ...prev,
          [appointmentId]: finalUrls.map(url => ({ url, previewUrl: url }))
        }));
        setSaved(prev => ({ ...prev, [appointmentId] : true }));
        showToast('Lưu thông tin thành công')

      } catch (err) {
        alert("Không thể lưu bệnh án. Thử lại.");
      } finally {
        setSaving(null);
      }
    };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  // Đếm số bệnh án đã lưu để hiển thị trên header
  const savedCount = records.filter(r => saved[r.appointmentId]).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/60 via-white to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 p-6 md:p-8 mb-6 shadow-lg">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

          <div className="relative">
            <Link
              to="/doctor/appointments"
              className="inline-flex items-center gap-1.5 text-sky-100 hover:text-white text-sm mb-3 transition"
            >
              <ArrowLeft size={16} /> Quay lại lịch khám
            </Link>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/20 backdrop-blur items-center justify-center ring-1 ring-white/30">
                <Stethoscope size={28} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sky-100 text-sm font-medium tracking-wide uppercase">
                  Khoa khám bệnh
                </p>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Ghi bệnh án</h1>
                {/* Chips: bookingCode + số pet */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {bookingCode && <InfoChip text={`#${bookingCode}`} mono />}
                  <InfoChip icon={<PawPrint size={12} />} text={`${records.length} thú cưng`} />
                  {savedCount > 0 && (
                    <InfoChip
                      icon={<CheckCircle2 size={12} />}
                      text={`${savedCount}/${records.length} đã lưu`}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Danh sách bệnh án từng pet */}
        <div className="space-y-5">
          {records.map((record) => {
            const form = forms[record.appointmentId];
            const isSaving = saving === record.appointmentId;
            const isSaved = saved[record.appointmentId];
            const recordImages = images[record.appointmentId] ?? [];
            const imageError = imageErrors[record.appointmentId];
            const canAddMore = recordImages.length < MAX_IMAGES;
            const petImage = record.petImageUrl || DEFAULT_PET_IMAGES[record.petSpecies] || DEFAULT_PET_IMAGES.OTHER;

            return (
              <div
                key={record.appointmentId}
                className={`relative bg-white rounded-2xl shadow-sm ring-1 overflow-hidden transition ${
                  isSaved ? 'ring-emerald-200' : 'ring-gray-100'
                }`}
              >
                {/* Thanh màu trái: emerald khi đã lưu, sky bình thường */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    isSaved ? 'bg-emerald-500' : 'bg-sky-500'
                  }`}
                />

                <div className="p-5 md:p-6 pl-6 md:pl-7">
                  {/* Header pet */}
                  <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <img
                        src={petImage}
                        alt={record.petName}
                        className="w-14 h-14 rounded-xl object-cover bg-white ring-2 ring-sky-100 shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            DEFAULT_PET_IMAGES[record.petSpecies] || DEFAULT_PET_IMAGES.OTHER;
                        }}
                      />
                      <div>
                        <h2 className="text-lg font-bold text-gray-800">{record.petName}</h2>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 bg-sky-50 ring-1 ring-sky-100 px-2 py-0.5 rounded-md mt-0.5">
                          <PawPrint size={11} />
                          {SPECIES_MAP[record.petSpecies] || record.petSpecies}
                        </span>
                      </div>
                    </div>
                    {isSaved && (
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 px-3 py-1 rounded-full">
                        <CheckCircle2 size={14} /> Đã lưu
                      </span>
                    )}
                  </div>

                  {/* Form bệnh án */}
                  <div className="space-y-4">
                    <FormField
                      icon={<Stethoscope size={14} className="text-rose-500" />}
                      label="Chẩn đoán"
                    >
                      <textarea
                        rows={2}
                        value={form.diagnosis}
                        onChange={(e) => updateField(record.appointmentId, 'diagnosis', e.target.value)}
                        placeholder="Nhập chẩn đoán bệnh..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      />
                    </FormField>

                    <FormField
                      icon={<ClipboardList size={14} className="text-sky-500" />}
                      label="Điều trị"
                    >
                      <textarea
                        rows={2}
                        value={form.treatment}
                        onChange={(e) => updateField(record.appointmentId, 'treatment', e.target.value)}
                        placeholder="Phác đồ điều trị..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      />
                    </FormField>

                    <FormField
                      icon={<Pill size={14} className="text-violet-500" />}
                      label="Đơn thuốc"
                    >
                      <textarea
                        rows={2}
                        value={form.prescription}
                        onChange={(e) => updateField(record.appointmentId, 'prescription', e.target.value)}
                        placeholder="Tên thuốc, liều lượng, cách dùng..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      />
                    </FormField>

                    <FormField
                      icon={<FileText size={14} className="text-amber-500" />}
                      label="Ghi chú của bác sĩ"
                    >
                      <textarea
                        rows={2}
                        value={form.notes}
                        onChange={(e) => updateField(record.appointmentId, 'notes', e.target.value)}
                        placeholder="Lưu ý đặc biệt, khuyến nghị cho chủ..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      />
                    </FormField>

                    <FormField
                      icon={<CalendarCheck size={14} className="text-emerald-500" />}
                      label="Ngày tái khám"
                    >
                      <input
                        type="date"
                        value={form.followUpDate}
                        onChange={(e) => updateField(record.appointmentId, 'followUpDate', e.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      />
                    </FormField>

                    {/* Upload nhiều ảnh bệnh án */}
                    <div className="bg-gray-50/70 ring-1 ring-gray-100 p-4 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                          <Paperclip size={14} className="text-gray-500" />
                          Ảnh bệnh án (X-quang, xét nghiệm,...)
                        </label>
                        <span className="text-xs text-gray-500 font-semibold bg-white ring-1 ring-gray-200 px-2 py-0.5 rounded-md">
                          {recordImages.length}/{MAX_IMAGES}
                        </span>
                      </div>

                      {imageError && (
                        <div className="bg-rose-50 text-rose-700 ring-1 ring-rose-200 p-2 rounded-lg text-xs font-medium mb-2 flex items-start gap-1.5">
                          <AlertCircle size={14} className="shrink-0 mt-0.5" />
                          <span>{imageError}</span>
                        </div>
                      )}

                      {/* Grid thumbnail */}
                      {recordImages.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
                          {recordImages.map((img, idx) => (
                            <div
                              key={idx}
                              className="relative group aspect-square rounded-xl ring-1 ring-gray-200 overflow-hidden bg-white"
                            >
                              <img src={img.previewUrl} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
                              {!img.url && (
                                <span className="absolute bottom-1 left-1 bg-sky-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold shadow">
                                  MỚI
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => removeImage(record.appointmentId, idx)}
                                className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-1 opacity-90 hover:opacity-100 hover:scale-110 transition shadow"
                                title="Xóa ảnh"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

{/* fileInputRefs khi được khai báo như thế thì nó giống như là 1 kho lưu trữ các input element mỗi input là 1 appoinment id và .current như là để truy xuất kho
fileInputRefs.current = {
  101: <input element/>,
  102: <input element/>,
  103: <input element/>,
}
tức là đoạn này
<input
  ref={(el) => { fileInputRefs.current[record.appointmentId] = el; }}
  type="file"
  accept="image/*"
  multiple
  onChange={(e) => handleFileChange(record.appointmentId, e)}
  className="hidden"
  />
ref như là nơi để gửi cái input element vào 1 cái kho ở đây là fileInputRefs dùng để sử dụng ở chỗ khác bằng cách .current  và
ref={(el) => { fileInputRefs.current[record.appointmentId] = el; }}
tức là mỗi input của mỗi card đều lưu element input của nó vào kho fileInputsRef với key là appoinmentId */}
                      <input
                        ref={(el) => { fileInputRefs.current[record.appointmentId] = el; }}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileChange(record.appointmentId, e)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[record.appointmentId]?.click()}
                        disabled={!canAddMore}
                        className="inline-flex items-center gap-2 px-3.5 py-2 border border-gray-200 rounded-xl bg-white text-gray-700 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700 transition text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Camera size={15} />
                        {canAddMore ? 'Thêm ảnh' : `Đã đủ ${MAX_IMAGES} ảnh`}
                      </button>
                      <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                        Mỗi ảnh tối đa {MAX_FILE_SIZE_MB}MB. Có thể chọn nhiều ảnh cùng lúc. Ảnh sẽ được upload khi bấm "Lưu bệnh án".
                      </p>
                    </div>
                  </div>

                  {/* Nút lưu */}
                  <div className="mt-5 flex justify-end items-center gap-3 pt-4 border-t border-gray-100">
                    {isSaved && !isSaving && (
                      <span className="text-xs text-emerald-600 font-medium">
                        Đã đồng bộ với máy chủ
                      </span>
                    )}
                    <button
                      onClick={() => handleSave(record.appointmentId)}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 bg-sky-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-sky-700 active:scale-[0.99] transition shadow-md disabled:opacity-50"
                    >
                      <Save size={16} />
                      {isSaving ? 'Đang lưu...' : 'Lưu bệnh án'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Chip thông tin trên header
function InfoChip({
  icon,
  text,
  mono,
}: {
  icon?: React.ReactNode;
  text: string;
  mono?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 bg-white/20 backdrop-blur ring-1 ring-white/25 text-white text-xs font-semibold px-2 py-0.5 rounded-md ${
        mono ? 'font-mono' : ''
      }`}
    >
      {icon}
      {text}
    </span>
  );
}

// Form field wrapper: icon + label + children
function FormField({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}
