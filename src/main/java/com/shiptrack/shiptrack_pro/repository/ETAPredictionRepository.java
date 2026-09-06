package com.shiptrack.shiptrack_pro.repository;

import com.shiptrack.shiptrack_pro.entity.ETAPrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ETAPredictionRepository extends JpaRepository<ETAPrediction, Long> {
    Optional<ETAPrediction> findByShipmentId(Long shipmentId);
    List<ETAPrediction> findByDelayRiskScoreGreaterThanEqual(Integer threshold);
    void deleteByShipmentId(Long shipmentId);
}
