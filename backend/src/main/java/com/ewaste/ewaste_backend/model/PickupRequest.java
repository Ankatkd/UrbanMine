package com.ewaste.ewaste_backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "pickup_requests")
public class PickupRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private String date;
    private String time;
    private String address;
    private String pincode;
    private String city;
    private String state;
    private String schedulerName;
    private String phone;
    private String email;
    private String wasteType;
    private String status;

    private Double latitude;
    private Double longitude;

    // REVERTED: Store image data as byte[] (BLOB)
    @Lob
    @Column(name = "image_data", columnDefinition = "LONGBLOB")
    private byte[] imageData; // Stores the image as binary data

    private Double weightKg;

    private Long assignedWorkerId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getSchedulerName() { return schedulerName; }
    public void setSchedulerName(String schedulerName) { this.schedulerName = schedulerName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getWasteType() { return wasteType; }
    public void setWasteType(String wasteType) { this.wasteType = wasteType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    // REVERTED: Getter/Setter for byte[] imageData
    public byte[] getImageData() { return imageData; }
    public void setImageData(byte[] imageData) { this.imageData = imageData; }

    public Double getWeightKg() { return weightKg; }
    public void setWeightKg(Double weightKg) { this.weightKg = weightKg; }

    private Double estimatedValue;
    private String brand;
    private String itemDetails;

    public Double getEstimatedValue() { return estimatedValue; }
    public void setEstimatedValue(Double estimatedValue) { this.estimatedValue = estimatedValue; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getItemDetails() { return itemDetails; }
    public void setItemDetails(String itemDetails) { this.itemDetails = itemDetails; }

    public Long getAssignedWorkerId() {
        return assignedWorkerId;
    }

    private String rescheduleReason;
    private String trackingStatus; // ASSIGNED, REACHED, COMPLETED, RECYCLED

    @OneToMany(mappedBy = "pickupRequest", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonManagedReference
    private java.util.List<PickupItem> items = new java.util.ArrayList<>();

    public String getRescheduleReason() { return rescheduleReason; }
    public void setRescheduleReason(String rescheduleReason) { this.rescheduleReason = rescheduleReason; }

    public String getTrackingStatus() { return trackingStatus; }
    public void setTrackingStatus(String trackingStatus) { this.trackingStatus = trackingStatus; }

    public java.util.List<PickupItem> getItems() { return items; }
    public void setItems(java.util.List<PickupItem> items) { this.items = items; }

    public void addItem(PickupItem item) {
        items.add(item);
        item.setPickupRequest(this);
    }

    public void setAssignedWorkerId(Long assignedWorkerId) {
        this.assignedWorkerId = assignedWorkerId;
    }
}
