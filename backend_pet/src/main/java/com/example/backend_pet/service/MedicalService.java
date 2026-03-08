package com.example.backend_pet.service;

import com.example.backend_pet.dto.MedicalRequest;
import com.example.backend_pet.dto.MedicalResponse;
import com.example.backend_pet.entity.Appointment;
import com.example.backend_pet.entity.MedicalRecord;
import com.example.backend_pet.repository.AppointmentRepository;
import com.example.backend_pet.repository.MedicalRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;


@Service
@RequiredArgsConstructor
public class MedicalService {
    private final AppointmentRepository appointmentRepository;
    private final MedicalRecordRepository medicalRecordRepository;

    public List<MedicalResponse> getRecord(String bookingCode) {
        List<Appointment> appointments = appointmentRepository.findByBookingCode(bookingCode);
        List<MedicalResponse> result = new ArrayList<>();
        for(Appointment apt : appointments) {
            MedicalRecord record = medicalRecordRepository.findByAppointmentId(apt.getId()).orElse(null);
            if(record != null) {
                result.add(mapToMedicalResponse(apt, record));
                System.out.println("Record trong for: " + record.toString());
            }
        }
        System.out.println("record: " + result.get(0).toString());

        return result;
    }
    private MedicalResponse mapToMedicalResponse(Appointment apt, MedicalRecord record) {
        return MedicalResponse.builder()
                .id(record.getId())
                .appointmentId(apt.getId())
                .petName(apt.getPet().getName())
                .petImageUrl(apt.getPet().getImageUrl())
                .petSpecies(apt.getPet().getSpecies().name())
                .diagnosis(record != null ? record.getDiagnosis() : null)
                .treatment(record != null ? record.getTreatment() : null)
                .prescription(record != null ? record.getPrescription() : null)
                .notes(record != null ? record.getNotes() : null)
                .followUpDate(record != null ? record.getFollowUpDate() : null)
                .build();
    }

    public MedicalResponse saveRecord(Long appointmentId, MedicalRequest medicalRequest) {
        MedicalRecord record = medicalRecordRepository.findByAppointmentId(appointmentId).orElse(null);
        System.out.println("medicalrequest: " + medicalRequest.toString());
        System.out.println("record truoc khi set value: " + record.toString());

        record.setDiagnosis(medicalRequest.getDiagnosis());
        record.setNotes((medicalRequest.getNotes()));
        record.setPrescription(medicalRequest.getPrescription());
        record.setTreatment(medicalRequest.getTreatment());
        record.setFollowUpDate(medicalRequest.getFollowUpDate());
        MedicalRecord savedRecord = medicalRecordRepository.save(record);
        System.out.println("record sau khi set value" + record.toString());

        return mapToMedicalResponse(record.getAppointment(), savedRecord);
    }
}