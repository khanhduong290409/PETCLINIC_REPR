package com.example.backend_pet.service;

import com.example.backend_pet.dto.AppointmentRequest;
import com.example.backend_pet.dto.AppointmentResponse;
import com.example.backend_pet.dto.WalkInAppointmentRequest;
import com.example.backend_pet.entity.Appointment;
import com.example.backend_pet.entity.MedicalRecord;
import com.example.backend_pet.entity.Pet;
import com.example.backend_pet.entity.PetService;
import com.example.backend_pet.entity.User;
import com.example.backend_pet.repository.AppointmentRepository;
import com.example.backend_pet.repository.MedicalRecordRepository;
import com.example.backend_pet.repository.PetRepository;
import com.example.backend_pet.repository.PetServiceRepository;
import com.example.backend_pet.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final PetRepository petRepository;
    private final PetServiceRepository petServiceRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final TimeSlotService timeSlotService;
    private final PasswordEncoder passwordEncoder;
    private final AppointmentNotificationService appointmentNotificationService;

    // Đặt lịch khám cho nhiều pet cùng lúc — userId lấy từ JWT, không tin giá trị trong body
    @Transactional
    public List<AppointmentResponse> createAppointments(AppointmentRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getPetIds() == null || request.getPetIds().isEmpty()) {
            throw new RuntimeException("Vui lòng chọn ít nhất 1 thú cưng");
        }

        LocalDate date = LocalDate.parse(request.getAppointmentDate());
        LocalTime time = LocalTime.parse(request.getAppointmentTime());

        List<PetService> services = loadServices(request.getServiceIds());
        List<Pet> pets = loadOwnedPets(request.getPetIds(), user);

        // Khóa slot và kiểm tra còn đủ chỗ cho số pet này.
        // Khóa giữ tới khi transaction commit, nên các lịch bên dưới được lưu trước khi request khác đếm
        timeSlotService.checkNotPast(date, time);
        timeSlotService.reserveCapacity(date, time, pets.size());

        // Khách đặt online: chờ admin xác nhận và phân công bác sĩ
        return saveBookingGroup(user, pets, services, date, time, request.getNotes(),
                null, Appointment.AppointmentStatus.PENDING);
    }

    // Admin tạo lịch cho khách đến tại quầy: tạo nhanh khách/pet nếu cần,
    // lịch được xác nhận luôn và có bác sĩ. Vẫn chiếm chỗ chung với khách online.
    @Transactional
    public List<AppointmentResponse> createWalkInAppointments(WalkInAppointmentRequest request) {
        LocalDate date = LocalDate.parse(request.getAppointmentDate());
        LocalTime time = LocalTime.parse(request.getAppointmentTime());

        if (request.getDoctorId() == null) {
            throw new RuntimeException("Vui lòng chọn bác sĩ");
        }
        User doctor = findDoctor(request.getDoctorId());

        User customer = findOrCreateWalkInCustomer(request);
        List<PetService> services = loadServices(request.getServiceIds());

        List<Pet> pets = new ArrayList<>();
        if (request.getPetIds() != null && !request.getPetIds().isEmpty()) {
            pets.addAll(loadOwnedPets(request.getPetIds(), customer));
        }
        boolean hasNewPet = request.getNewPetName() != null && !request.getNewPetName().isBlank();
        if (hasNewPet) {
            pets.add(createQuickPet(customer, request.getNewPetName().trim(), request.getNewPetSpecies()));
        }
        if (pets.isEmpty()) {
            throw new RuntimeException("Vui lòng chọn ít nhất 1 thú cưng");
        }

        // Không chặn giờ đã qua: khách tại quầy thường vào khám ngay khung giờ hiện tại
        timeSlotService.reserveCapacity(date, time, pets.size());
        // Mã nhóm mới nên chưa trùng với lượt nào → truyền chuỗi rỗng
        checkDoctorAvailable(doctor, date, time, "");

        return saveBookingGroup(customer, pets, services, date, time, request.getNotes(),
                doctor, Appointment.AppointmentStatus.CONFIRMED);
    }

    // Lưu 1 lượt đặt: mỗi pet 1 appointment + 1 bệnh án rỗng, chung bookingCode
    private List<AppointmentResponse> saveBookingGroup(User owner, List<Pet> pets, List<PetService> services,
                                                       LocalDate date, LocalTime time, String notes,
                                                       User doctor, Appointment.AppointmentStatus status) {
        String bookingCode = "BK-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"))
                + "-" + UUID.randomUUID().toString().substring(0, 4);

        List<Appointment> savedGroup = new ArrayList<>();
        List<AppointmentResponse> result = new ArrayList<>();
        for (Pet pet : pets) {
            Appointment appointment = Appointment.builder()
                    .user(owner)
                    .pet(pet)
                    .services(new ArrayList<>(services))
                    .doctor(doctor)
                    .appointmentDate(date)
                    .appointmentTime(time)
                    .status(status)
                    .bookingCode(bookingCode)
                    .notes(notes)
                    .build();
            Appointment savedAppointment = appointmentRepository.save(appointment);

            MedicalRecord medicalRecord = MedicalRecord.builder()
                    .appointment(savedAppointment)
                    .diagnosis("")
                    .treatment("")
                    .prescription("")
                    .notes("")
                    .followUpDate(null)
                    .build();
            medicalRecordRepository.save(medicalRecord);

            savedGroup.add(savedAppointment);
            result.add(mapToResponse(savedAppointment));
        }
        appointmentNotificationService.notifyBookingCreated(savedGroup);
        return result;
    }

    private List<PetService> loadServices(List<Long> serviceIds) {
        if (serviceIds == null || serviceIds.isEmpty()) {
            throw new RuntimeException("Vui lòng chọn ít nhất 1 dịch vụ");
        }
        List<PetService> services = new ArrayList<>();
        for (Long serviceId : serviceIds) {
            PetService service = petServiceRepository.findById(serviceId)
                    .orElseThrow(() -> new RuntimeException("Service not found: " + serviceId));
            services.add(service);
        }
        return services;
    }

    private List<Pet> loadOwnedPets(List<Long> petIds, User owner) {
        List<Pet> pets = new ArrayList<>();
        for (Long petId : petIds) {
            Pet pet = petRepository.findById(petId)
                    .orElseThrow(() -> new RuntimeException("Pet not found: " + petId));
            if (!pet.getOwner().getId().equals(owner.getId())) {
                throw new RuntimeException("Pet " + petId + " không thuộc user này");
            }
            pets.add(pet);
        }
        return pets;
    }

    // Khách đã có tài khoản → dùng luôn. Khách mới → tạo tài khoản nội bộ theo SĐT.
    // Email giả và mật khẩu ngẫu nhiên chỉ để thỏa ràng buộc NOT NULL của bảng users;
    // khách không đăng nhập bằng tài khoản này.
    private User findOrCreateWalkInCustomer(WalkInAppointmentRequest request) {
        if (request.getCustomerId() != null) {
            return userRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }

        String name = request.getNewCustomerName();
        String phone = request.getNewCustomerPhone();
        if (name == null || name.isBlank() || phone == null || phone.isBlank()) {
            throw new RuntimeException("Vui lòng nhập họ tên và số điện thoại khách hàng");
        }
        String trimmedPhone = phone.trim();
        if (!trimmedPhone.matches("\\d{9,11}")) {
            throw new RuntimeException("Số điện thoại không hợp lệ");
        }

        // Khách tại quầy từng đến với SĐT này rồi → dùng lại tài khoản cũ
        String walkInEmail = "walkin-" + trimmedPhone + "@pawcare.local";
        Optional<User> existing = userRepository.findByEmail(walkInEmail);
        if (existing.isPresent()) {
            return existing.get();
        }

        User customer = User.builder()
                .email(walkInEmail)
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .fullName(name.trim())
                .phone(trimmedPhone)
                .role(User.Role.USER)
                .build();
        return userRepository.save(customer);
    }

    private Pet createQuickPet(User owner, String name, String species) {
        if (species == null || species.isBlank()) {
            throw new RuntimeException("Vui lòng chọn loài cho thú cưng mới");
        }
        Pet pet = Pet.builder()
                .owner(owner)
                .name(name)
                .species(Pet.Species.valueOf(species))
                .build();
        return petRepository.save(pet);
    }

    private User findDoctor(Long doctorId) {
        User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        if (doctor.getRole() != User.Role.DOCTOR) {
            throw new RuntimeException("Người được chọn không phải bác sĩ");
        }
        return doctor;
    }

    // Một bác sĩ không nhận 2 lượt đặt khác nhau trong cùng ngày + giờ.
    // Gọi sau khi đã khóa slot (reserveCapacity / lockSlot) để 2 admin không xếp trùng cùng lúc.
    private void checkDoctorAvailable(User doctor, LocalDate date, LocalTime time, String currentBookingCode) {
        boolean busy = appointmentRepository.existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusNotAndBookingCodeNot(
                doctor.getId(), date, time, Appointment.AppointmentStatus.CANCELLED, currentBookingCode);
        if (busy) {
            throw new RuntimeException(doctor.getFullName() + " đã có lịch khác lúc "
                    + time.format(DateTimeFormatter.ofPattern("HH:mm")) + " ngày "
                    + date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        }
    }

    // Lấy danh sách lịch khám của user
    public List<AppointmentResponse> getAppointmentsByUser(Long userId) {
        List<Appointment> appointments = appointmentRepository.findByUserIdOrderByAppointmentDateDesc(userId);
        return appointments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Hủy lịch khám — hủy toàn bộ nhóm cùng bookingCode
    @Transactional
    public List<AppointmentResponse> cancelAppointment(Long appointmentId, Long userId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (!appointment.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        // Lấy tất cả appointment cùng bookingCode
        List<Appointment> group = appointmentRepository.findByBookingCode(appointment.getBookingCode());
        List<Appointment> cancelled = new ArrayList<>();

        for (Appointment apt : group) {
            if (apt.getStatus() == Appointment.AppointmentStatus.COMPLETED) {
                throw new RuntimeException("Không thể hủy lịch khám đã hoàn thành");
            }
            if (apt.getStatus() != Appointment.AppointmentStatus.CANCELLED) {
                apt.setStatus(Appointment.AppointmentStatus.CANCELLED);
                cancelled.add(appointmentRepository.save(apt));
            }
        }

        // Bấm hủy lại lịch đã hủy thì không báo lần nữa
        if (!cancelled.isEmpty()) {
            appointmentNotificationService.notifyCancelledByCustomer(group);
        }
        return cancelled.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // === Doctor methods ===

    // Lấy lịch khám được phân công cho bác sĩ
    public List<AppointmentResponse> getAppointmentsByDoctor(Long doctorId) {
        return appointmentRepository.findByDoctorIdOrderByAppointmentDateAsc(doctorId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // Bác sĩ xác nhận đã khám xong — complete toàn bộ nhóm cùng bookingCode
    @Transactional
    public List<AppointmentResponse> completeAppointmentGroup(Long appointmentId, Long doctorId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (appointment.getDoctor() == null || !appointment.getDoctor().getId().equals(doctorId)) {
            throw new RuntimeException("Bạn không được phân công lịch khám này");
        }

        if (appointment.getStatus() != Appointment.AppointmentStatus.CONFIRMED) {
            throw new RuntimeException("Chỉ có thể hoàn thành lịch đã được xác nhận");
        }

        List<Appointment> group = appointmentRepository.findByBookingCode(appointment.getBookingCode());
        List<AppointmentResponse> result = new ArrayList<>();
        for (Appointment apt : group) {
            apt.setStatus(Appointment.AppointmentStatus.COMPLETED);
            result.add(mapToResponse(appointmentRepository.save(apt)));
        }
        appointmentNotificationService.notifyCompleted(group);
        return result;
    }

    // === Admin methods ===

    // Lấy tất cả lịch khám
    public List<AppointmentResponse> getAllAppointments() {
        return appointmentRepository.findAllByOrderByAppointmentDateDesc()
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // Lịch chưa hủy trong một khung giờ — admin xem khi chỉnh/khóa slot
    public List<AppointmentResponse> getAppointmentsInSlot(LocalDate date, LocalTime time) {
        List<Appointment> appointmentsOfDay = appointmentRepository.findByAppointmentDateAndStatusNot(
                date, Appointment.AppointmentStatus.CANCELLED);
        List<AppointmentResponse> result = new ArrayList<>();
        for (Appointment appointment : appointmentsOfDay) {
            if (appointment.getAppointmentTime().equals(time)) {
                result.add(mapToResponse(appointment));
            }
        }
        return result;
    }

    // Bỏ phân công bác sĩ — áp dụng cho toàn bộ nhóm cùng bookingCode
    @Transactional
    public List<AppointmentResponse> unassignDoctor(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        // Lấy bác sĩ cũ trước khi xóa để còn báo cho họ
        User oldDoctor = appointment.getDoctor();

        List<Appointment> group = appointmentRepository.findByBookingCode(appointment.getBookingCode());
        List<AppointmentResponse> result = new ArrayList<>();
        for (Appointment apt : group) {
            apt.setDoctor(null);
            result.add(mapToResponse(appointmentRepository.save(apt)));
        }

        if (oldDoctor != null) {
            appointmentNotificationService.notifyDoctorUnassigned(group, oldDoctor);
        }
        return result;
    }

    // Phân công bác sĩ — áp dụng cho toàn bộ nhóm cùng bookingCode
    @Transactional
    public List<AppointmentResponse> assignDoctor(Long appointmentId, Long doctorId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        User doctor = findDoctor(doctorId);

        // Khóa slot trước khi kiểm tra để 2 admin không xếp cùng bác sĩ vào 2 lượt cùng lúc
        timeSlotService.lockSlot(appointment.getAppointmentDate(), appointment.getAppointmentTime());
        checkDoctorAvailable(doctor, appointment.getAppointmentDate(), appointment.getAppointmentTime(),
                appointment.getBookingCode());

        // Đổi từ bác sĩ A sang bác sĩ B → báo A là lịch đã chuyển đi
        User oldDoctor = appointment.getDoctor();
        boolean sameDoctor = oldDoctor != null && oldDoctor.getId().equals(doctor.getId());

        List<Appointment> group = appointmentRepository.findByBookingCode(appointment.getBookingCode());
        List<AppointmentResponse> result = new ArrayList<>();
        for (Appointment apt : group) {
            apt.setDoctor(doctor);
            result.add(mapToResponse(appointmentRepository.save(apt)));
        }

        // Chọn lại đúng bác sĩ đang phụ trách thì không báo lại
        if (!sameDoctor) {
            if (oldDoctor != null) {
                appointmentNotificationService.notifyDoctorUnassigned(group, oldDoctor);
            }
            appointmentNotificationService.notifyDoctorAssigned(group, doctor);
        }
        return result;
    }

    // Đổi trạng thái — áp dụng cho toàn bộ nhóm cùng bookingCode
    @Transactional
    public List<AppointmentResponse> updateStatus(Long appointmentId, String status) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        Appointment.AppointmentStatus newStatus = Appointment.AppointmentStatus.valueOf(status);
        List<Appointment> group = appointmentRepository.findByBookingCode(appointment.getBookingCode());

        // Khôi phục lịch đã hủy sẽ chiếm lại chỗ trong slot → phải kiểm tra sức chứa
        if (newStatus != Appointment.AppointmentStatus.CANCELLED) {
            int restoringCount = 0;
            for (Appointment apt : group) {
                if (apt.getStatus() == Appointment.AppointmentStatus.CANCELLED) {
                    restoringCount++;
                }
            }
            if (restoringCount > 0) {
                timeSlotService.reserveCapacity(
                        appointment.getAppointmentDate(), appointment.getAppointmentTime(), restoringCount);
            }
        }

        // Lấy trạng thái cũ trước vòng lặp — chọn lại đúng trạng thái đang có thì không báo
        Appointment.AppointmentStatus oldStatus = appointment.getStatus();

        List<AppointmentResponse> result = new ArrayList<>();
        for (Appointment apt : group) {
            apt.setStatus(newStatus);
            result.add(mapToResponse(appointmentRepository.save(apt)));
        }

        if (oldStatus != newStatus) {
            appointmentNotificationService.notifyStatusChanged(group, newStatus);
        }
        return result;
    }

    // Map entity sang DTO
    private AppointmentResponse mapToResponse(Appointment appointment) {
        List<AppointmentResponse.ServiceInfo> serviceInfos = appointment.getServices().stream()
                .map(s -> AppointmentResponse.ServiceInfo.builder()
                        .id(s.getId())
                        .title(s.getTitle())
                        .price(s.getPrice())
                        .build())
                .collect(Collectors.toList());

        return AppointmentResponse.builder()
                .id(appointment.getId())
                .bookingCode(appointment.getBookingCode())
                .petName(appointment.getPet().getName())
                .petSpecies(appointment.getPet().getSpecies().name())
                .petImageUrl(appointment.getPet().getImageUrl())
                .services(serviceInfos)
                .doctorId(appointment.getDoctor() != null ? appointment.getDoctor().getId() : null)
                .doctorName(appointment.getDoctor() != null ? appointment.getDoctor().getFullName() : null)
                .ownerName(appointment.getUser().getFullName())
                .appointmentDate(appointment.getAppointmentDate().toString())
                .appointmentTime(appointment.getAppointmentTime().toString())
                .status(appointment.getStatus().name())
                .notes(appointment.getNotes())
                .createdAt(appointment.getCreatedAt())
                .build();
    }
}
