package com.ewaste.ewaste_backend.service;

import com.ewaste.ewaste_backend.model.Worker;
import com.ewaste.ewaste_backend.repository.WorkerRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class WorkerService {

    @Autowired
    private WorkerRepository workerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private GoMapsProService goMapsProService;

    @Transactional
    public Worker registerWorker(Worker worker) {
        // Encode password
        worker.setPassword(passwordEncoder.encode(worker.getPassword()));
        
        // Geocode only if coordinates are not provided
        if (worker.getLatitude() == null || worker.getLongitude() == null) {
            String fullAddressToGeocode = worker.getLocation() + ", " + worker.getCity() + ", " + worker.getPincode();
            Optional<double[]> coords = goMapsProService.geocodeAddress(fullAddressToGeocode);
            
            if (coords.isPresent()) {
                worker.setLatitude(coords.get()[0]);
                worker.setLongitude(coords.get()[1]);
            } else {
                throw new IllegalArgumentException("Failed to determine geographical coordinates for the provided location. Please refine the address.");
            }
        }
        
        return workerRepository.save(worker);
    }

    public Optional<Worker> findWorkerByUsername(String username) {
        return workerRepository.findByUsername(username);
    }

    public Optional<Worker> findWorkerById(Long workerId) {
        return workerRepository.findById(workerId);
    }

    public List<Worker> getAllWorkers() {
        return workerRepository.findAll();
    }

    public List<Worker> findWorkersByCity(String city) {
        return workerRepository.findByCity(city);
    }

    public List<Worker> findWorkersByPincode(String pincode) {
        return workerRepository.findByPincode(pincode);
    }

    public List<Worker> findWorkersByCityAndPincode(String city, String pincode) {
        return workerRepository.findByCityAndPincode(city, pincode);
    }
}
