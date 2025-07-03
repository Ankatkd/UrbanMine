package com.ewaste.ewaste_backend.dto;

import java.time.LocalDate;

public class DailyPickupCount {

    private LocalDate date;
    private long count;

    public DailyPickupCount(LocalDate date, long count) {
        this.date = date;
        this.count = count;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public long getCount() {
        return count;
    }

    public void setCount(long count) {
        this.count = count;
    }
}
