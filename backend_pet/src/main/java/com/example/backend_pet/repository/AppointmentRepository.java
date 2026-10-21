package com.example.backend_pet.repository;

import com.example.backend_pet.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByUserIdOrderByAppointmentDateDesc(Long userId);

    List<Appointment> findByBookingCode(String bookingCode);

    List<Appointment> findByDoctorIdOrderByAppointmentDateAsc(Long doctorId);

    List<Appointment> findByAppointmentDateBetween(LocalDate start, LocalDate end);

    List<Appointment> findAllByOrderByAppointmentDateDesc();

    // Số pet đã đặt trong một khung giờ — truyền CANCELLED để không tính lịch đã hủy
    long countByAppointmentDateAndAppointmentTimeAndStatusNot(
            LocalDate appointmentDate, LocalTime appointmentTime, Appointment.AppointmentStatus excludedStatus);

    // Các khung giờ từ fromDate trở đi đang có nhiều hơn `capacity` pet.
    // Mỗi phần tử: [LocalDate ngày, LocalTime giờ, Long số pet]
    @Query("SELECT a.appointmentDate, a.appointmentTime, COUNT(a) FROM Appointment a "
            + "WHERE a.appointmentDate >= :fromDate AND a.status <> :excludedStatus "
            + "GROUP BY a.appointmentDate, a.appointmentTime "
            + "HAVING COUNT(a) > :capacity")
    List<Object[]> findSlotsBookedMoreThan(
            LocalDate fromDate, Appointment.AppointmentStatus excludedStatus, long capacity);

    // Bác sĩ đã có lượt đặt khác (khác bookingCode) cùng ngày + giờ chưa — để chặn xếp trùng
    boolean existsByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusNotAndBookingCodeNot(
            Long doctorId, LocalDate appointmentDate, LocalTime appointmentTime,
            Appointment.AppointmentStatus excludedStatus, String excludedBookingCode);

    // Toàn bộ lịch chưa hủy của một ngày — dùng để tính chỗ trống cho cả 19 khung giờ trong 1 lần query
    List<Appointment> findByAppointmentDateAndStatusNot(
            LocalDate appointmentDate, Appointment.AppointmentStatus excludedStatus);

    // Lịch cần gửi email nhắc: đúng ngày + trạng thái, chưa nhắc lần nào (null = lịch cũ trước khi có cột này)
    @Query("SELECT a FROM Appointment a "
            + "WHERE a.appointmentDate = :appointmentDate AND a.status = :status "
            + "AND (a.reminderSent IS NULL OR a.reminderSent = false)")
    List<Appointment> findNotRemindedAppointments(
            LocalDate appointmentDate, Appointment.AppointmentStatus status);
}
