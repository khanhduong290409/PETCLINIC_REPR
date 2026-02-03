package com.example.backend_pet.repository;

import com.example.backend_pet.entity.PetService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PetServiceRepository extends JpaRepository<PetService, Long> {

    List<PetService> findByCategory(String category);
}
