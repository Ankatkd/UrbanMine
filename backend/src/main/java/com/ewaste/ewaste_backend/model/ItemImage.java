package com.ewaste.ewaste_backend.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "item_images")
public class ItemImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] imageData;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pickup_item_id")
    @JsonIgnore
    private PickupItem pickupItem;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public byte[] getImageData() { return imageData; }
    public void setImageData(byte[] imageData) { this.imageData = imageData; }

    public PickupItem getPickupItem() { return pickupItem; }
    public void setPickupItem(PickupItem pickupItem) { this.pickupItem = pickupItem; }
}
