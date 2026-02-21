package com.example.backend_pet.service;

import com.example.backend_pet.dto.AppointmentRequest;
import com.example.backend_pet.dto.AppointmentResponse;
import com.example.backend_pet.entity.Appointment;
import com.example.backend_pet.entity.Pet;
import com.example.backend_pet.entity.User;
import com.example.backend_pet.repository.AppointmentRepository;
import com.example.backend_pet.repository.PetRepository;
import com.example.backend_pet.repository.PetServiceRepository;
import com.example.backend_pet.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final PetRepository petRepository;
    private final PetServiceRepository petServiceRepository;

    // Đặt lịch khám cho nhiều pet cùng lúc
    @Transactional
    public List<AppointmentResponse> createAppointments(AppointmentRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        com.example.backend_pet.entity.PetService service = petServiceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service not found"));

        LocalDate date = LocalDate.parse(request.getAppointmentDate());
        LocalTime time = LocalTime.parse(request.getAppointmentTime());

        // Sinh mã lịch khám chung cho nhóm
        String bookingCode = "BK-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"))
                + "-" + UUID.randomUUID().toString().substring(0, 4);

        List<Appointment> appointments = new ArrayList<>();

        for (Long petId : request.getPetIds()) {
            Pet pet = petRepository.findById(petId)
                    .orElseThrow(() -> new RuntimeException("Pet not found: " + petId));

            // Kiểm tra pet có thuộc user không
            if (!pet.getOwner().getId().equals(user.getId())) {
                throw new RuntimeException("Pet " + petId + " không thuộc user này");
            }

            Appointment appointment = Appointment.builder()
                    .user(user)
                    .pet(pet)
                    .service(service)
                    .appointmentDate(date)
                    .appointmentTime(time)
                    .bookingCode(bookingCode)
                    .notes(request.getNotes())
                    .build();

            appointments.add(appointmentRepository.save(appointment));
        }

        return appointments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
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

        return cancelled.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // Map entity sang DTO
    private AppointmentResponse mapToResponse(Appointment appointment) {
        return AppointmentResponse.builder()
                .id(appointment.getId())
                .bookingCode(appointment.getBookingCode())
                .petName(appointment.getPet().getName())
                .petSpecies(appointment.getPet().getSpecies().name())
                .petImageUrl(appointment.getPet().getImageUrl())
                .serviceTitle(appointment.getService().getTitle())
                .servicePrice(appointment.getService().getPrice())
                .doctorName(appointment.getDoctor() != null ? appointment.getDoctor().getFullName() : null)
                .appointmentDate(appointment.getAppointmentDate().toString())
                .appointmentTime(appointment.getAppointmentTime().toString())
                .status(appointment.getStatus().name())
                .notes(appointment.getNotes())
                .createdAt(appointment.getCreatedAt())
                .build();
    }
}
