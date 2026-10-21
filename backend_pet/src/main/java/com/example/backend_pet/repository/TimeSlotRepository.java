package com.example.backend_pet.repository;

import com.example.backend_pet.entity.TimeSlot;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {

    // Tạo dòng slot nếu chưa có. Hai request cùng tạo một lúc thì unique constraint
    // chặn bản thứ hai và ON CONFLICT bỏ qua nó thay vì ném lỗi
    @Modifying
    @Query(value = "INSERT INTO time_slots (slot_date, slot_time, disabled, created_at) "
            + "VALUES (:slotDate, :slotTime, false, NOW()) "
            + "ON CONFLICT (slot_date, slot_time) DO NOTHING",
            nativeQuery = true)
    void insertIfMissing(LocalDate slotDate, LocalTime slotTime);

    // SELECT ... FOR UPDATE: request khác muốn khóa cùng slot phải chờ transaction này kết thúc
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM TimeSlot s WHERE s.slotDate = :slotDate AND s.slotTime = :slotTime")
    Optional<TimeSlot> findForUpdate(LocalDate slotDate, LocalTime slotTime);

    Optional<TimeSlot> findBySlotDateAndSlotTime(LocalDate slotDate, LocalTime slotTime);

    List<TimeSlot> findBySlotDate(LocalDate slotDate);
}
