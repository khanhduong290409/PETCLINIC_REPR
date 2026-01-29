// frontend/src/components/home/Services.tsx
import { SERVICE_DATA } from "../../utils/constants";
import type { Service } from "../../types/index";
import doctorDog from "../../assets/poster-service.webp";
import backgroundService from "../../assets/bg-chim-service.jpg";

export default function Services() {
  // Tách services theo position để hiển thị 2 cột
  const leftServices = SERVICE_DATA.filter(s => s.position === 'left') as Service[];
  const rightServices = SERVICE_DATA.filter(s => s.position === 'right') as Service[];

  return (
    <section
      id="services"
      className="relative py-20 bg-cover bg-center"
      style={{ backgroundImage: `url(${backgroundService})` }}
    >
      {/* Overlay làm mềm nền */}
      <div className="absolute inset-0 bg-white/70 z-0 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-sky-900 mb-12">
          CÁC DỊCH VỤ CHÍNH
        </h2>

        {/* Giữ 3 cột từ >=640px; <640px mới xuống 1 cột */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3 lg:gap-4 mx-auto">
          {/* LEFT COLUMN */}
          <ServiceColumn services={leftServices} align="right" />

          {/* CENTER IMAGE */}
          <div className="flex justify-center">
            <img
              src={doctorDog}
              alt="Bác sĩ và thú cưng"
              className="
                rounded-3xl shadow-lg ring-4 ring-white object-cover
                w-[320px] md:w-[420px] lg:w-[520px] h-auto max-h-[520px]
              "
            />
          </div>

          {/* RIGHT COLUMN */}
          <ServiceColumn services={rightServices} align="left" />
        </div>
      </div>
    </section>
  );
}

// ==================== SUB-COMPONENTS ====================

interface ServiceColumnProps {
  services: Service[];
  align: 'left' | 'right';
}

/**
 * ServiceColumn - Component hiển thị một cột services
 * @param services - Danh sách services cần hiển thị
 * @param align - Căn chỉnh nội dung (left hoặc right)
 */
function ServiceColumn({ services, align }: ServiceColumnProps) {
  const isRight = align === 'right';
  
  return (
    <div className={`flex flex-col gap-6 ${isRight ? 'text-right sm:pr-2' : 'text-left sm:pl-2'}`}>
      {services.map((service) => (
        <ServiceCard 
          key={service.id} 
          service={service} 
          align={align}
        />
      ))}
    </div>
  );
}

interface ServiceCardProps {
  service: Service;
  align: 'left' | 'right';
}

/**
 * ServiceCard - Card cho mỗi service item
 */
function ServiceCard({ service, align }: ServiceCardProps) {
  const isRight = align === 'right';
  
  return (
    <div 
      className={`flex items-center gap-4 ${isRight ? 'justify-end' : 'justify-start'}`}
    >
      {/* Nếu align right, hiển thị content trước image */}
      {isRight && <ServiceContent service={service} />}
      
      {/* Service image */}
      <ServiceImage service={service} />
      
      {/* Nếu align left, hiển thị image trước content */}
      {!isRight && <ServiceContent service={service} />}
    </div>
  );
}

/**
 * ServiceImage - Circular image cho service
 */
function ServiceImage({ service }: { service: Service }) {
  return (
    <img
      src={service.imageUrl}
      alt={service.title}
      className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover shadow-md ring-4 ring-white hover:scale-110 transition-transform duration-300"
      loading="lazy"
    />
  );
}

/**
 * ServiceContent - Text content cho service
 */
function ServiceContent({ service }: { service: Service }) {
  return (
    <div className="max-w-[260px]">
      <h3 className="font-bold text-sky-900 text-base md:text-lg mb-1">
        {service.title}
      </h3>
      <p className="text-gray-600 text-sm md:text-[15px] leading-relaxed mb-2">
        {service.description}
      </p>
      {/* Hiển thị thêm giá và thời gian nếu cần */}
      <div className="flex items-center gap-3 text-xs text-sky-700">
        <span className="font-semibold">
          {service.price.toLocaleString()}đ
        </span>
        <span className="text-gray-500">•</span>
        <span>{service.duration} phút</span>
      </div>
    </div>
  );
}