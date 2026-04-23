package com.example.backend_pet.repository;

import com.example.backend_pet.entity.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    Optional<MedicalRecord> findByAppointmentId(Long appointmentId);
    /*
SELECT m.* FROM medical_record m
JOIN appointment a ON m.appointment_id = a.id
WHERE a.pet_id = ?
ORDER BY a.appointment_date DESC

findBy Appointment_PetId

Vào MedicalRecord, đi sang appointment, lấy field petId
→ WHERE appointment.pet_id = ? (tham số Long petId truyền vào)
OrderBy Appointment_AppointmentDate Desc

Vào MedicalRecord, đi sang appointment, lấy field appointmentDate
→ ORDER BY appointment.appointment_date DESC (mới nhất trước)

dấu - là dấu đi sâu vào mối quan hệ
     */
    List<MedicalRecord> findByAppointment_PetIdOrderByAppointment_AppointmentDateDesc(Long petId);
}
