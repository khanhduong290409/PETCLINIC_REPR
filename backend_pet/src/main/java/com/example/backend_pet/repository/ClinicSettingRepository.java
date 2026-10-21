package com.example.backend_pet.repository;

import com.example.backend_pet.entity.ClinicSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClinicSettingRepository extends JpaRepository<ClinicSetting, Long> {

    // Bảng chỉ có 1 dòng nên lấy dòng đầu tiên
    Optional<ClinicSetting> findFirstByOrderByIdAsc();
}
