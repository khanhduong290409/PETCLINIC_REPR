package com.example.backend_pet.repository;

import com.example.backend_pet.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRole(User.Role role);

    // Tìm khách theo SĐT, email hoặc tên — dùng khi admin tạo lịch tại quầy
    @Query("SELECT u FROM User u WHERE u.role = :role AND ("
            + "u.phone LIKE CONCAT('%', :keyword, '%') "
            + "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) "
            + "OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<User> searchByKeyword(User.Role role, String keyword);
}
