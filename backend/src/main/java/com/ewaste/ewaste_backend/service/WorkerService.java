package com.ewaste.ewaste_backend.service;

import com.ewaste.ewaste_backend.model.Worker;
import com.ewaste.ewaste_backend.repository.WorkerRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class WorkerService {

    @Autowired
    private WorkerRepository workerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Worker registerWorker(Worker worker) {
        worker.setPassword(passwordEncoder.encode(worker.getPassword()));
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
