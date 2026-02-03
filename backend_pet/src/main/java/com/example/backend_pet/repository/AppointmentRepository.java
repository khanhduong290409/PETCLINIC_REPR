package com.example.backend_pet.repository;

import com.example.backend_pet.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByUserIdOrderByAppointmentDateDesc(Long userId);

    List<Appointment> findByDoctorIdOrderByAppointmentDateAsc(Long doctorId);

    List<Appointment> findByAppointmentDateBetween(LocalDate start, LocalDate end);
}
