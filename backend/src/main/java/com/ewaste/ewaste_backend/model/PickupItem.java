package com.ewaste.ewaste_backend.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

@Entity
@Table(name = "pickup_items")
public class PickupItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String wasteType;
    private String brand;
    private String model;
    private String itemDetails;
    private Double estimatedValue;
    private Double weightKg;
    private String status; // "PENDING", "VERIFIED", "REJECTED"
    private Double aiConfidence; // To flag low confidence items

    @Lob
    @Column(name = "image_data", columnDefinition = "LONGBLOB")
    private byte[] imageData;
    
    // Fallback if we store path instead of blob for new items
    private String imageUrl; 

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pickup_request_id")
    @JsonBackReference
    private PickupRequest pickupRequest;

    // Getters and Setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getWasteType() { return wasteType; }
    public void setWasteType(String wasteType) { this.wasteType = wasteType; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getItemDetails() { return itemDetails; }
    public void setItemDetails(String itemDetails) { this.itemDetails = itemDetails; }

    public Double getEstimatedValue() { return estimatedValue; }
    public void setEstimatedValue(Double estimatedValue) { this.estimatedValue = estimatedValue; }

    public Double getWeightKg() { return weightKg; }
    public void setWeightKg(Double weightKg) { this.weightKg = weightKg; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Double getAiConfidence() { return aiConfidence; }
    public void setAiConfidence(Double aiConfidence) { this.aiConfidence = aiConfidence; }

    public byte[] getImageData() { return imageData; }
    public void setImageData(byte[] imageData) { this.imageData = imageData; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    @OneToMany(mappedBy = "pickupItem", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<ItemImage> images = new java.util.ArrayList<>();

    public java.util.List<ItemImage> getImages() { return images; }
    public void setImages(java.util.List<ItemImage> images) { this.images = images; }
    
    public void addImage(ItemImage image) {
        images.add(image);
        image.setPickupItem(this);
    }

    public PickupRequest getPickupRequest() { return pickupRequest; }
    public void setPickupRequest(PickupRequest pickupRequest) { this.pickupRequest = pickupRequest; }
}
