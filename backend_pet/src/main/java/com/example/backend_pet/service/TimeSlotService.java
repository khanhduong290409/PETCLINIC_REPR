package com.example.backend_pet.service;

import com.example.backend_pet.dto.SlotAvailabilityResponse;
import com.example.backend_pet.entity.Appointment;
import com.example.backend_pet.entity.ClinicSetting;
import com.example.backend_pet.entity.TimeSlot;
import com.example.backend_pet.repository.AppointmentRepository;
import com.example.backend_pet.repository.ClinicSettingRepository;
import com.example.backend_pet.repository.TimeSlotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TimeSlotService {

    // Sức chứa dùng khi bảng clinic_settings chưa có dòng nào
    private static final int INITIAL_DEFAULT_CAPACITY = 3;
    // Chặn admin gõ nhầm số quá lớn
    private static final int MAX_CAPACITY = 50;

    // Khung giờ làm việc: 08:00 → 17:00, mỗi slot 30 phút (19 slot)
    private static final LocalTime FIRST_SLOT_TIME = LocalTime.of(8, 0);
    private static final LocalTime LAST_SLOT_TIME = LocalTime.of(17, 0);
    private static final int SLOT_MINUTES = 30;

    // Server deploy (Render) chạy giờ UTC, phải so với giờ Việt Nam
    private static final ZoneId CLINIC_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final TimeSlotRepository timeSlotRepository;
    private final ClinicSettingRepository clinicSettingRepository;
    private final AppointmentRepository appointmentRepository;

    // Danh sách mốc giờ cố định trong ngày
    public List<LocalTime> getAllSlotTimes() {
        List<LocalTime> slotTimes = new ArrayList<>();
        LocalTime current = FIRST_SLOT_TIME;
        while (!current.isAfter(LAST_SLOT_TIME)) {
            slotTimes.add(current);
            current = current.plusMinutes(SLOT_MINUTES);
        }
        return slotTimes;
    }

    // Lấy dòng cấu hình, chưa có thì tạo với giá trị mặc định ban đầu
    @Transactional
    public ClinicSetting getOrCreateSetting() {
        Optional<ClinicSetting> existing = clinicSettingRepository.findFirstByOrderByIdAsc();
        if (existing.isPresent()) {
            return existing.get();
        }
        ClinicSetting setting = ClinicSetting.builder()
                .defaultSlotCapacity(INITIAL_DEFAULT_CAPACITY)
                .build();
        return clinicSettingRepository.save(setting);
    }

    public int getDefaultCapacity() {
        return getOrCreateSetting().getDefaultSlotCapacity();
    }

    // Chặn đặt vào giờ đã qua — chỉ áp cho khách đặt online.
    // Admin (khôi phục lịch cũ, khách tại quầy) không bị chặn bởi hàm này.
    public void checkNotPast(LocalDate date, LocalTime time) {
        if (isPast(date, time)) {
            throw new RuntimeException("Không thể đặt lịch vào thời điểm đã qua");
        }
    }

    // Giữ chỗ cho petCount pet trong khung giờ, ném lỗi nếu không đủ chỗ.
    // MANDATORY: bắt buộc chạy bên trong transaction của nơi gọi, để khóa slot
    // được giữ tới khi lịch hẹn đã lưu xong — nếu nhả khóa sớm thì request khác sẽ đếm thiếu.
    @Transactional(propagation = Propagation.MANDATORY)
    public void reserveCapacity(LocalDate date, LocalTime time, int petCount) {
        validateSlotTime(time);

        // Bước 1 + 2: tạo dòng slot nếu chưa có rồi khóa nó
        TimeSlot slot = lockSlot(date, time);

        String slotLabel = time.format(TIME_FORMAT) + " ngày " + date.format(DATE_FORMAT);

        if (Boolean.TRUE.equals(slot.getDisabled())) {
            throw new RuntimeException("Khung giờ " + slotLabel + " đã bị khóa, vui lòng chọn giờ khác");
        }

        // Bước 3: đếm số đã đặt và so với sức chứa
        int capacity = resolveCapacity(slot, getDefaultCapacity());
        long bookedCount = appointmentRepository.countByAppointmentDateAndAppointmentTimeAndStatusNot(
                date, time, Appointment.AppointmentStatus.CANCELLED);
        long remaining = Math.max(0, capacity - bookedCount);

        if (petCount > remaining) {
            if (remaining == 0) {
                throw new RuntimeException("Khung giờ " + slotLabel + " đã đầy, vui lòng chọn giờ khác");
            }
            throw new RuntimeException("Khung giờ " + slotLabel + " chỉ còn " + remaining
                    + " chỗ, không đủ cho " + petCount + " thú cưng");
        }
        // Bước 4: nơi gọi lưu lịch hẹn, commit transaction thì khóa mới được nhả
    }

    // Khóa dòng slot tới hết transaction của nơi gọi — request khác vào cùng slot phải chờ.
    // Dùng chung cho giữ chỗ và phân công bác sĩ.
    @Transactional(propagation = Propagation.MANDATORY)
    public TimeSlot lockSlot(LocalDate date, LocalTime time) {
        // Phải có dòng thì mới có chỗ để khóa
        timeSlotRepository.insertIfMissing(date, time);
        return timeSlotRepository.findForUpdate(date, time)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khung giờ"));
    }

    // Tình trạng chỗ trống của cả ngày
    @Transactional
    public List<SlotAvailabilityResponse> getAvailability(LocalDate date) {
        int defaultCapacity = getDefaultCapacity();

        // Đếm số pet đã đặt theo từng giờ
        List<Appointment> activeAppointments = appointmentRepository.findByAppointmentDateAndStatusNot(
                date, Appointment.AppointmentStatus.CANCELLED);
        Map<LocalTime, Integer> bookedCountByTime = new HashMap<>();
        for (Appointment appointment : activeAppointments) {
            bookedCountByTime.merge(appointment.getAppointmentTime(), 1, Integer::sum);
        }

        // Các slot đã được tạo trong ngày (có thể bị chỉnh riêng hoặc khóa)
        Map<LocalTime, TimeSlot> slotByTime = new HashMap<>();
        for (TimeSlot slot : timeSlotRepository.findBySlotDate(date)) {
            slotByTime.put(slot.getSlotTime(), slot);
        }

        List<SlotAvailabilityResponse> result = new ArrayList<>();
        for (LocalTime time : getAllSlotTimes()) {
            TimeSlot slot = slotByTime.get(time);
            int bookedCount = bookedCountByTime.getOrDefault(time, 0);

            int capacity = defaultCapacity;
            Integer customCapacity = null;
            boolean disabled = false;
            String note = null;
            if (slot != null) {
                capacity = resolveCapacity(slot, defaultCapacity);
                customCapacity = slot.getCapacity();
                disabled = Boolean.TRUE.equals(slot.getDisabled());
                note = slot.getNote();
            }

            int remaining = Math.max(0, capacity - bookedCount);
            boolean past = isPast(date, time);
            boolean available = !disabled && !past && remaining > 0;

            result.add(SlotAvailabilityResponse.builder()
                    .time(time.format(TIME_FORMAT))
                    .bookedCount(bookedCount)
                    .capacity(capacity)
                    .customCapacity(customCapacity)
                    .remaining(remaining)
                    .disabled(disabled)
                    .past(past)
                    .available(available)
                    .note(note)
                    .build());
        }
        return result;
    }

    // === Admin ===

    // Đổi sức chứa mặc định. Không đụng tới lịch đã đặt:
    // slot nào đang có nhiều lịch hơn số mới thì chỉ chuyển sang "đầy"
    @Transactional
    public int updateDefaultCapacity(int newCapacity) {
        validateCapacity(newCapacity);
        ClinicSetting setting = getOrCreateSetting();
        setting.setDefaultSlotCapacity(newCapacity);
        clinicSettingRepository.save(setting);
        return newCapacity;
    }

    // Đếm số khung giờ từ hôm nay trở đi sẽ bị vượt nếu đổi mặc định sang newCapacity
    // — để admin thấy cảnh báo trước khi lưu. Slot đã chỉnh riêng không bị ảnh hưởng nên bỏ qua.
    public int countSlotsOverCapacity(int newCapacity) {
        LocalDate today = LocalDate.now(CLINIC_ZONE);
        List<Object[]> crowdedSlots = appointmentRepository.findSlotsBookedMoreThan(
                today, Appointment.AppointmentStatus.CANCELLED, newCapacity);

        int count = 0;
        for (Object[] row : crowdedSlots) {
            LocalDate date = (LocalDate) row[0];
            LocalTime time = (LocalTime) row[1];
            Optional<TimeSlot> slot = timeSlotRepository.findBySlotDateAndSlotTime(date, time);
            boolean hasCustomCapacity = slot.isPresent() && slot.get().getCapacity() != null;
            if (!hasCustomCapacity) {
                count++;
            }
        }
        return count;
    }

    // Chỉnh riêng một khung giờ: sức chứa riêng, khóa, ghi chú
    @Transactional
    public void updateSlot(LocalDate date, LocalTime time, Integer capacity, boolean disabled, String note) {
        validateSlotTime(time);
        if (capacity != null) {
            validateCapacity(capacity);
        }
        TimeSlot slot = getOrCreateSlot(date, time);
        slot.setCapacity(capacity);
        slot.setDisabled(disabled);
        slot.setNote(note);
        timeSlotRepository.save(slot);
    }

    // Khóa hoặc mở lại toàn bộ khung giờ trong ngày. Giữ nguyên sức chứa riêng của từng slot
    @Transactional
    public void setDayDisabled(LocalDate date, boolean disabled, String note) {
        for (LocalTime time : getAllSlotTimes()) {
            TimeSlot slot = getOrCreateSlot(date, time);
            slot.setDisabled(disabled);
            slot.setNote(note);
            timeSlotRepository.save(slot);
        }
    }

    private TimeSlot getOrCreateSlot(LocalDate date, LocalTime time) {
        timeSlotRepository.insertIfMissing(date, time);
        return timeSlotRepository.findBySlotDateAndSlotTime(date, time)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khung giờ"));
    }

    private void validateSlotTime(LocalTime time) {
        if (!getAllSlotTimes().contains(time)) {
            throw new RuntimeException("Khung giờ " + time.format(TIME_FORMAT) + " không hợp lệ");
        }
    }

    private void validateCapacity(int capacity) {
        if (capacity < 1 || capacity > MAX_CAPACITY) {
            throw new RuntimeException("Sức chứa phải từ 1 đến " + MAX_CAPACITY
                    + ". Muốn đóng khung giờ thì dùng chức năng khóa");
        }
    }

    // Sức chứa thực tế: chỉnh riêng nếu có, ngược lại theo mặc định
    private int resolveCapacity(TimeSlot slot, int defaultCapacity) {
        if (slot.getCapacity() != null) {
            return slot.getCapacity();
        }
        return defaultCapacity;
    }

    private boolean isPast(LocalDate date, LocalTime time) {
        LocalDateTime now = LocalDateTime.now(CLINIC_ZONE);
        return LocalDateTime.of(date, time).isBefore(now);
    }
}
