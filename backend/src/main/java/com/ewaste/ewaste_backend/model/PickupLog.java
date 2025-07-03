package com.ewaste.ewaste_backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pickup_logs")
public class PickupLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pickup_request_id", nullable = false)
    private PickupRequest pickupRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    private Worker worker;

    @Column(nullable = false)
    private String oldStatus;

    @Column(nullable = false)
    private String newStatus;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column
    private Double collectedKgs;

    @Column(length = 500)
    private String notes;

    public PickupLog() {
    }

    public PickupLog(PickupRequest pickupRequest, Worker worker, String oldStatus, String newStatus, Double collectedKgs, String notes) {
        this.pickupRequest = pickupRequest;
        this.worker = worker;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.collectedKgs = collectedKgs;
        this.notes = notes;
        this.timestamp = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public PickupRequest getPickupRequest() {
        return pickupRequest;
    }

    public void setPickupRequest(PickupRequest pickupRequest) {
        this.pickupRequest = pickupRequest;
    }

    public Worker getWorker() {
        return worker;
    }

    public void setWorker(Worker worker) {
        this.worker = worker;
    }

    public String getOldStatus() {
        return oldStatus;
    }

    public void setOldStatus(String oldStatus) {
        this.oldStatus = oldStatus;
    }

    public String getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(String newStatus) {
        this.newStatus = newStatus;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public Double getCollectedKgs() {
        return collectedKgs;
    }

    public void setCollectedKgs(Double collectedKgs) {
        this.collectedKgs = collectedKgs;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    @Override
    public String toString() {
        return "PickupLog{" +
                "id=" + id +
                ", pickupRequestId=" + (pickupRequest != null ? pickupRequest.getId() : "null") +
                ", workerId=" + (worker != null ? worker.getId() : "null") +
                ", oldStatus='" + oldStatus + '\'' +
                ", newStatus='" + newStatus + '\'' +
                ", timestamp=" + timestamp +
                ", collectedKgs=" + collectedKgs +
                ", notes='" + notes + '\'' +
                '}';
    }
}
