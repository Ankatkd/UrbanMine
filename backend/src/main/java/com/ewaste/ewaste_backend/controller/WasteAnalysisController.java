package com.ewaste.ewaste_backend.controller;

import com.ewaste.ewaste_backend.service.WasteAnalysisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/waste")
@CrossOrigin(origins = "http://localhost:3000")
public class WasteAnalysisController {

    @Autowired
    private WasteAnalysisService wasteAnalysisService;

    @PostMapping("/analyze")
    public ResponseEntity<Map<String, Object>> analyzeWaste(@RequestParam("image") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please upload an image"));
        }
        
        Map<String, Object> analysisResult = wasteAnalysisService.analyzeWasteImage(file);
        return ResponseEntity.ok(analysisResult);
    }
}
