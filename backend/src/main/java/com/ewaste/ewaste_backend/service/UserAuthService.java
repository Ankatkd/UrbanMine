package com.ewaste.ewaste_backend.service;

import com.ewaste.ewaste_backend.model.User;
import com.ewaste.ewaste_backend.model.Worker;
import com.ewaste.ewaste_backend.repository.UserRepository;
import com.ewaste.ewaste_backend.repository.WorkerRepository;
import com.ewaste.ewaste_backend.repository.AdminTableRepository;
import com.ewaste.ewaste_backend.model.Admin;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Optional;

@Service
public class UserAuthService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkerRepository workerRepository;

    @Autowired
    private GoMapsProService goMapsProService;

    @Autowired
    private AdminTableRepository adminTableRepository;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        Optional<User> userOptional = userRepository.findByEmail(identifier);
        if (userOptional.isEmpty()) {
            userOptional = userRepository.findByPhone(identifier);
        }

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            return new org.springframework.security.core.userdetails.User(
                user.getEmail() != null ? user.getEmail() : user.getPhone(),
                user.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().toUpperCase()))
            );
        }

        Optional<Worker> workerOptional = workerRepository.findByUsername(identifier);
        if (workerOptional.isEmpty()) {
            workerOptional = workerRepository.findByEmail(identifier);
        }

        if (workerOptional.isPresent()) {
            Worker worker = workerOptional.get();
            return new org.springframework.security.core.userdetails.User(
                worker.getUsername(),
                worker.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_WORKER"))
            );
        }

        Optional<Admin> adminOptional = adminTableRepository.findByEmailId(identifier);
        if (adminOptional.isPresent()) {
            Admin admin = adminOptional.get();
            return new org.springframework.security.core.userdetails.User(
                admin.getEmailId(),
                admin.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN"))
            );
        }

        throw new UsernameNotFoundException("User, Worker, or Admin not found with identifier: " + identifier);
    }

    @Transactional
    public User registerUser(User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new IllegalArgumentException("User with this email already exists.");
        }

        if (user.getPhone() != null && !user.getPhone().isEmpty() &&
            userRepository.findByPhone(user.getPhone()).isPresent()) {
            throw new IllegalArgumentException("User with this phone number already exists.");
        }

        if (user.getLatitude() == null || user.getLongitude() == null) {
            String fullAddressToGeocode = user.getLocation() + ", " + user.getCity() + ", " + user.getPincode();
            Optional<double[]> coords = goMapsProService.geocodeAddress(fullAddressToGeocode);

            if (coords.isPresent()) {
                user.setLatitude(coords.get()[0]);
                user.setLongitude(coords.get()[1]);
            } else {
                throw new IllegalArgumentException("Failed to determine geographical coordinates for the provided location. Please refine the address.");
            }
        }

        return userRepository.save(user);
    }

    public Optional<User> getUserProfileById(Long userId) {
        return userRepository.findById(userId);
    }

    @Transactional
    public User updateUserProfile(Long userId, User userUpdates) {
        User existingUser = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        if (userUpdates.getFullname() != null) existingUser.setFullname(userUpdates.getFullname());
        if (userUpdates.getEmail() != null) existingUser.setEmail(userUpdates.getEmail());
        if (userUpdates.getPhone() != null) existingUser.setPhone(userUpdates.getPhone());
        // Password update should be handled separately and securely, not directly here.

        boolean locationChanged = false;

        if (userUpdates.getLocation() != null && !userUpdates.getLocation().equals(existingUser.getLocation())) {
            existingUser.setLocation(userUpdates.getLocation());
            locationChanged = true;
        }
        if (userUpdates.getCity() != null && !userUpdates.getCity().equals(existingUser.getCity())) {
            existingUser.setCity(userUpdates.getCity());
            locationChanged = true;
        }
        if (userUpdates.getPincode() != null && !userUpdates.getPincode().equals(existingUser.getPincode())) {
            existingUser.setPincode(userUpdates.getPincode());
            locationChanged = true;
        }

        if (locationChanged) {
            String fullAddressToGeocode = existingUser.getLocation() + ", " + existingUser.getCity() + ", " + existingUser.getPincode();
            Optional<double[]> coords = goMapsProService.geocodeAddress(fullAddressToGeocode);
            if (coords.isPresent()) {
                existingUser.setLatitude(coords.get()[0]);
                existingUser.setLongitude(coords.get()[1]);
            } else {
                throw new IllegalArgumentException("Failed to re-geocode updated location for user. Please refine the address.");
            }
        }

        return userRepository.save(existingUser);
    }
}
