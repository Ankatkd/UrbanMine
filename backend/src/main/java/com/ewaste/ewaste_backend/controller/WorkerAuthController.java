package com.ewaste.ewaste_backend.controller;

import com.ewaste.ewaste_backend.dto.LoginRequest;
import com.ewaste.ewaste_backend.dto.LoginResponse;
import com.ewaste.ewaste_backend.model.Worker;
import com.ewaste.ewaste_backend.service.JwtService;
import com.ewaste.ewaste_backend.service.WorkerService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/worker")
@CrossOrigin
public class WorkerAuthController {

    @Autowired
    private WorkerService workerService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @PostMapping("/register")
    public ResponseEntity<String> registerWorker(@RequestBody Worker worker) {
        try {
            if (workerService.findWorkerByUsername(worker.getUsername()).isPresent()) {
                return ResponseEntity.badRequest().body("Username already taken.");
            }
            workerService.registerWorker(worker);
            return ResponseEntity.ok("Worker registered successfully!");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error registering worker: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginWorker(@RequestBody LoginRequest loginRequest) {
        String username = loginRequest.getIdentifier();
        String password = loginRequest.getPassword();

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String token = jwtService.generateToken(userDetails);

            return ResponseEntity.ok(new LoginResponse("Worker login successful", null, token, "worker"));

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body(new LoginResponse("Invalid worker credentials", null, null, null));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(new LoginResponse("Worker authentication failed: " + e.getMessage(), null, null, null));
        }
    }
}
