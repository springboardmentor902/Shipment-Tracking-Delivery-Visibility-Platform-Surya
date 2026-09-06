package com.shiptrack.shiptrack_pro.repository;

import com.shiptrack.shiptrack_pro.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShipmentRepository extends JpaRepository<Shipment, Long> {

    List<Shipment> findByCreatedByOrderByIdDesc(Long userId);

    List<Shipment> findByAssignedOperatorIdOrderByIdDesc(Long operatorId);

    List<Shipment> findAllByOrderByIdDesc();

    List<Shipment> findByBusinessIdOrderByIdDesc(Long businessId);

    Optional<Shipment> findByTrackingNumber(String trackingNumber);
}