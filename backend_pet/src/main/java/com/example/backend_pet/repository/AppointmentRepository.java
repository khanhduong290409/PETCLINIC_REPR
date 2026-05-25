package com.example.backend_pet.repository;

import com.example.backend_pet.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByUserIdOrderByAppointmentDateDesc(Long userId);

    List<Appointment> findByBookingCode(String bookingCode);

    List<Appointment> findByDoctorIdOrderByAppointmentDateAsc(Long doctorId);

    List<Appointment> findByAppointmentDateBetween(LocalDate start, LocalDate end);

    List<Appointment> findAllByOrderByAppointmentDateDesc();

    // Đếm số nhóm booking đang active (PENDING/CONFIRMED) theo từng khung giờ trong 1 ngày.
    // Trả về: [appointmentTime, countDistinctBookingCode]
    @Query("SELECT a.appointmentTime, COUNT(DISTINCT a.bookingCode) " +
           "FROM Appointment a " +
           "WHERE a.appointmentDate = :date AND a.status <> com.example.backend_pet.entity.Appointment.AppointmentStatus.CANCELLED " +
           "GROUP BY a.appointmentTime")
    List<Object[]> countActiveBookingsPerSlot(@Param("date") LocalDate date);
}
