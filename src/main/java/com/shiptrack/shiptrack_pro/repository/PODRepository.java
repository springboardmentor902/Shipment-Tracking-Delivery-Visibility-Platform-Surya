package com.shiptrack.shiptrack_pro.repository;

import com.shiptrack.shiptrack_pro.entity.ProofOfDelivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PODRepository extends JpaRepository<ProofOfDelivery, Long> {
    Optional<ProofOfDelivery> findByShipmentId(Long shipmentId);
    List<ProofOfDelivery> findByVerificationStatus(String verificationStatus);
    void deleteByShipmentId(Long shipmentId);
}
