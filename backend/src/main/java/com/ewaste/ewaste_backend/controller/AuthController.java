package com.ewaste.ewaste_backend.controller;

import com.ewaste.ewaste_backend.dto.LoginRequest;
import com.ewaste.ewaste_backend.dto.LoginResponse;
import com.ewaste.ewaste_backend.model.User;
import com.ewaste.ewaste_backend.repository.UserRepository;
import com.ewaste.ewaste_backend.service.JwtService;
import com.ewaste.ewaste_backend.util.TableCreator;
import com.ewaste.ewaste_backend.service.UserAuthService; // Import UserAuthService
// removed unused GoMapsProService import

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus; // Import HttpStatus
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
// removed unused Map import

@RestController
@RequestMapping("/api")
@CrossOrigin
public class AuthController {

    @Autowired
    private UserRepository userRepository; // Still used for direct access in login success flow

    @Autowired
    private TableCreator tableCreator;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserAuthService userAuthService; // Use the service for registration/profile updates

    // GoMapsProService no longer used here

    @GetMapping("/user/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        // Use userAuthService to get user profile, which will now return lat/lng if available
        Optional<User> userOptional = userAuthService.getUserProfileById(id);
        return userOptional.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }
    @GetMapping("/encode")
public String encode() {
    return passwordEncoder.encode("admin123");
}


    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@RequestBody User user) {
        try {
            // Encode password before passing to service
            user.setPassword(passwordEncoder.encode(user.getPassword()));

            // Now, let the UserAuthService handle the geocoding and saving
            User savedUser = userAuthService.registerUser(user);

            // Create user history table after successful registration
            tableCreator.createUserHistoryTable(savedUser.getId(), savedUser.getFullname());
            return ResponseEntity.ok("User registered successfully!");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error registering user: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        String identifier = loginRequest.getIdentifier();
        String password = loginRequest.getPassword();
        String requestedRole = loginRequest.getRole();

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(identifier, password)
            );

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();

            // Determine role: user, worker, or admin
            // username available if needed for auditing

            Optional<User> userOpt;
            if (identifier.contains("@")) {
                userOpt = userRepository.findByEmail(identifier);
            } else {
                userOpt = userRepository.findByPhone(identifier);
            }

            if (userOpt.isPresent()) {
                User user = userOpt.get();
                if (!user.getRole().equalsIgnoreCase(requestedRole)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(new LoginResponse("Role mismatch. User is registered as " + user.getRole(), null, null, user.getRole().toLowerCase()));
                }
                String token = jwtService.generateToken(userDetails);
                return ResponseEntity.ok(new LoginResponse("Login successful", user.getId(), token, user.getRole().toLowerCase()));
            }

            // If not a regular user, check if worker or admin; for worker, WorkerAuthController handles login separately.
            // For admin, we accept requestedRole 'admin' and return token with role 'admin'.
            if ("admin".equalsIgnoreCase(requestedRole)) {
                String token = jwtService.generateToken(userDetails);
                return ResponseEntity.ok(new LoginResponse("Login successful", null, token, "admin"));
            }

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new LoginResponse("Account not found after authentication", null, null, null));

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new LoginResponse("Invalid credentials", null, null, null));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new LoginResponse("Authentication failed: " + e.getMessage(), null, null, null));
        }
    }

    // You might also want an endpoint for users to update their profile, similar to WorkerAuthController
    @PutMapping("/user/profile/{userId}")
    public ResponseEntity<String> updateUserProfile(@PathVariable Long userId, @RequestBody User userUpdates) {
        try {
            userAuthService.updateUserProfile(userId, userUpdates);
            return ResponseEntity.ok("User profile updated successfully.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating user profile: " + e.getMessage());
        }
    }
}
