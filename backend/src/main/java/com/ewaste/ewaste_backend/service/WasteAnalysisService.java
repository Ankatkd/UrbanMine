package com.ewaste.ewaste_backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import java.util.*;
import java.io.IOException;

@Service
public class WasteAnalysisService {

    @Value("${google.maps.api.key}")
    private String googleApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> analyzeWasteImage(MultipartFile file) {
        Map<String, Object> result = new HashMap<>();
        
        // 1. Try Google Vision API (Primary)
        try {
            Map<String, Object> visionResult = analyzeWithVisionApi(file);
            if (visionResult != null && visionResult.containsKey("detectedItem")) {
                result.putAll(visionResult);
                
                // Add Brand Detection (Filename Priority -> Content Fallback)
                String filename = file.getOriginalFilename().toLowerCase();
                String brand = detectBrand(filename);
                if (brand == null) {
                    brand = detectBrandFromContent(file);
                }
                result.put("brand", brand != null ? brand : "Generic / Unknown");
                
                // Check for low confidence (User Requirement: < 90%)
                double confidence = (Double) result.get("confidence");
                if (confidence < 0.90) {
                    result.put("lowConfidence", true);
                    result.put("message", "Confidence low (" + (int)(confidence * 100) + "%). Please upload another image for better accuracy.");
                } else {
                    result.put("lowConfidence", false);
                }

                return result;
            }
        } catch (Exception e) {
            System.err.println("Vision API failed: " + e.getMessage());
            e.printStackTrace();
        }

        // 2. Fallback (If API completely fails) - Flag as Low Confidence
        result.put("detectedItem", "Unknown Item");
        result.put("confidence", 0.0);
        result.put("lowConfidence", true);
        result.put("brand", "Generic / Unknown");
        result.put("message", "Could not analyze image. Please upload a clearer photo.");
        
        return result;
    }

    private Map<String, Object> analyzeWithVisionApi(MultipartFile file) {
        try {
            System.out.println("Calling Vision API...");
            String url = "https://vision.googleapis.com/v1/images:annotate?key=" + googleApiKey;
            
            String base64Image = Base64.getEncoder().encodeToString(file.getBytes());
            
            // Build JSON Request
            Map<String, Object> imageMap = new HashMap<>();
            imageMap.put("content", base64Image);
            
            Map<String, Object> featureMap = new HashMap<>();
            featureMap.put("type", "LABEL_DETECTION");
            featureMap.put("maxResults", 10);
            
            Map<String, Object> requestMap = new HashMap<>();
            requestMap.put("image", imageMap);
            requestMap.put("features", Collections.singletonList(featureMap));
            
            Map<String, Object> body = new HashMap<>();
            body.put("requests", Collections.singletonList(requestMap));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            
            System.out.println("Vision API Response Code: " + response.getStatusCode());
            System.out.println("Vision API Body: " + response.getBody());

            if (response.getStatusCode() == HttpStatus.OK) {
                ObjectMapper mapper = new ObjectMapper();
                Map<String, Object> respMap = mapper.readValue(response.getBody(), new TypeReference<Map<String, Object>>(){});
                
                List<Map<String, Object>> responses = (List<Map<String, Object>>) respMap.get("responses");
                if (responses != null && !responses.isEmpty()) {
                    List<Map<String, Object>> labelAnnotations = (List<Map<String, Object>>) responses.get(0).get("labelAnnotations");
                    if (labelAnnotations != null) {
                        for (Map<String, Object> annotation : labelAnnotations) {
                            String description = (String) annotation.get("description");
                            double score = ((Number) annotation.get("score")).doubleValue();
                            
                            System.out.println("Label: " + description + ", Score: " + score);

                            String category = mapToCategory(description);
                            if (!category.equals("Electronic Device (Generic)")) {
                                System.out.println("Mapped to Category: " + category);
                                Map<String, Object> result = new HashMap<>();
                                populateDataForCategory(category, result);
                                result.put("detectedItem", category); // Ensure exact category name
                                result.put("confidence", score);
                                return result;
                            }
                        }
                    } else {
                        System.out.println("No labelAnnotations found.");
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error calling Vision API: " + e.getMessage());
            e.printStackTrace();
        }
        return null;
    }

    private String mapToCategory(String label) {
        label = label.toLowerCase();
        if (containsAny(label, "laptop", "notebook", "computer", "screen", "monitor", "pc")) return "Laptop / Computer";
        if (containsAny(label, "phone", "cellular", "mobile", "ipod", "iphone", "smartphone")) return "Smartphone";
        if (containsAny(label, "television", "monitor", "screen", "display", "led", "lcd")) return "LED/LCD Monitor";
        if (containsAny(label, "printer", "photocopier")) return "Printer";
        if (containsAny(label, "refrigerator", "fridge", "freezer", "ice box", "cooler")) return "Refrigerator";
        if (containsAny(label, "washer", "washing", "laundry")) return "Washing Machine";
        if (containsAny(label, "microwave", "oven")) return "Microwave Oven";
        if (containsAny(label, "radio", "speaker", "amplifier", "receiver", "stereo", "audio", "sound")) return "Audio Equipment (Amplifier/Receiver)";
        // NEW: Wire/Cable/PCB Support
        if (containsAny(label, "wire", "cable", "cord", "copper")) return "Cables & Wires";
        if (containsAny(label, "circuit", "pcb", "board", "motherboard", "electronics")) return "Printed Circuit Boards (PCBs)";
        
        return "Electronic Device (Generic)";
    }

    private boolean containsAny(String text, String... keywords) {
        for (String k : keywords) {
            if (text.contains(k)) return true;
        }
        return false;
    }

    private void populateDataForCategory(String category, Map<String, Object> result) {
        if (category.contains("Laptop")) populateLaptopData(result);
        else if (category.contains("Smartphone")) populatePhoneData(result);
        else if (category.contains("Monitor")) populateMonitorData(result);
        else if (category.contains("Printer")) populatePrinterData(result);
        else if (category.contains("Refrigerator")) populateRefrigeratorData(result);
        else if (category.contains("Washing")) populateWashingMachineData(result);
        else if (category.contains("Microwave")) populateMicrowaveData(result);
        else if (category.contains("Audio")) populateAudioEquipmentData(result);
        else if (category.contains("Cable") || category.contains("Wire")) populateCableWireData(result);
        else if (category.contains("Circuit") || category.contains("PCB")) populatePCBData(result);
        else populatePhoneData(result); // Fallback
    }



    private String detectBrand(String filename) {
        List<String> brands = Arrays.asList(
            "apple", "samsung", "dell", "hp", "lenovo", "asus", "acer", "sony", "lg", "canon", "epson", "xiaomi", "oneplus", "google", "microsoft", "whirlpool", "godrej", "haier", "panasonic", "ifb", "jbl", "bose", "yamaha", "pioneer", "denon", "marantz", "onkyo"
        );
        for (String b : brands) {
            if (filename.contains(b)) {
                return b.substring(0, 1).toUpperCase() + b.substring(1);
            }
        }
        return null;
    }

    private String detectBrandFromContent(MultipartFile file) {
        // Removed random brand guessing based on file hash at user request.
        // If we can't detect it from filename or Vision API, we return Generic.
        return "Generic / Unknown";
    }

    private void detectItemFromContent(MultipartFile file, Map<String, Object> result) {
        try {
            // Create a deterministic hash from file size and a byte sample
            long hash = file.getSize();
            if (file.getBytes().length > 0) {
                hash += file.getBytes()[0];
            }
            
            // 8 distinct categories for fallback (added Audio)
            int category = (int) (hash % 8);

            switch (category) {
                case 0:
                    populateLaptopData(result);
                    break;
                case 1:
                    populatePhoneData(result);
                    break;
                case 2:
                    populateMonitorData(result);
                    break;
                case 3:
                    populatePrinterData(result);
                    break;
                case 4:
                    populateRefrigeratorData(result);
                    break;
                case 5:
                    populateWashingMachineData(result);
                    break;
                case 6:
                    populateMicrowaveData(result);
                    break;
                case 7:
                    populateAudioEquipmentData(result);
                    break;
                default:
                    populatePhoneData(result); 
            }
            
            double confidence = 0.85 + ((hash % 15) / 100.0); // 0.85 to 0.99
            result.put("confidence", confidence);

        } catch (Exception e) {
            populatePhoneData(result);
            result.put("confidence", 0.80);
        }
    }

    // --- Helper Methods to Populate Data ---

    private void populateLaptopData(Map<String, Object> result) {
        result.put("detectedItem", "Laptop / Computer");
        result.put("confidence", 0.98);
        result.put("elements", Arrays.asList(
            createElement("Gold (Motherboard/Pins)", 0.6, 5200.0),
            createElement("Silver (Contacts/Solder)", 1.8, 75.0),
            createElement("Copper (Heatsink/Wiring)", 300.0, 0.75),
            createElement("Aluminum (Casing/Frame)", 400.0, 0.22),
            createElement("Steel (Screws/Frame)", 150.0, 0.05),
            createElement("Palladium (Capacitors)", 0.03, 3500.0),
            createElement("Platinum (Hard Drive)", 0.01, 2800.0)
        ));
        result.put("totalEstimatedValue", 3656.5);
    }

    private void populatePhoneData(Map<String, Object> result) {
        result.put("detectedItem", "Smartphone");
        result.put("confidence", 0.99);
        result.put("elements", Arrays.asList(
            createElement("Gold (PCB/Pins)", 0.038, 5200.0),
            createElement("Silver (Solder/Paste)", 0.40, 75.0),
            createElement("Copper (Coils/PCB)", 18.0, 0.75),
            createElement("Palladium (MLCCs)", 0.017, 3500.0),
            createElement("Platinum", 0.002, 2800.0),
            createElement("Aluminum (Casing)", 25.0, 0.22),
            createElement("Lithium (Battery)", 22.0, 2.5),
            createElement("Rare Earths (Display/Speakers)", 0.5, 10.0)
        ));
        result.put("totalEstimatedValue", 365.2);
    }

    private void populateMonitorData(Map<String, Object> result) {
        result.put("detectedItem", "LED/LCD Monitor");
        result.put("confidence", 0.96);
        result.put("elements", Arrays.asList(
            createElement("Copper (Magnet Wire/PCB)", 450.0, 0.75),
            createElement("Aluminum (Shielding)", 850.0, 0.22),
            createElement("Gold (Connectors)", 0.12, 5200.0),
            createElement("Steel (Mounting/Chassis)", 1600.0, 0.05),
            createElement("Plastic (Casing)", 1200.0, 0.02)
        ));
        result.put("totalEstimatedValue", 1232.5);
    }

    private void populatePrinterData(Map<String, Object> result) {
        result.put("detectedItem", "Printer");
        result.put("confidence", 0.94);
        result.put("elements", Arrays.asList(
            createElement("Steel (Rod/Mechanism)", 2200.0, 0.05),
            createElement("Copper (Motors/Cables)", 180.0, 0.75),
            createElement("Aluminum (Rollers)", 120.0, 0.22),
            createElement("Plastic (Body)", 3000.0, 0.02),
            createElement("Gold (PCB)", 0.05, 5200.0)
        ));
        result.put("totalEstimatedValue", 531.4);
    }

    private void populateRefrigeratorData(Map<String, Object> result) {
        result.put("detectedItem", "Refrigerator");
        result.put("confidence", 0.95);
        result.put("elements", Arrays.asList(
            createElement("Steel (Outer Body)", 36000.0, 0.05),
            createElement("Copper (Compressor/Coils)", 1600.0, 0.75),
            createElement("Aluminum (Shelves/Lines)", 900.0, 0.22),
            createElement("Plastic (Liner)", 5500.0, 0.02),
            createElement("Freon/Coolant (Careful Disposal)", 200.0, 0.0)
        ));
        result.put("totalEstimatedValue", 3308.0);
    }

    private void populateWashingMachineData(Map<String, Object> result) {
        result.put("detectedItem", "Washing Machine");
        result.put("confidence", 0.93);
        result.put("elements", Arrays.asList(
            createElement("Steel (Drum/Panel)", 26000.0, 0.05),
            createElement("Copper (Motor Windings)", 1300.0, 0.75),
            createElement("Aluminum (Pulley/Pump)", 400.0, 0.22),
            createElement("Plastic (Details)", 4200.0, 0.02),
            createElement("Rubber (Hoses/Seals)", 800.0, 0.01)
        ));
        result.put("totalEstimatedValue", 2459.0);
    }

    private void populateMicrowaveData(Map<String, Object> result) {
        result.put("detectedItem", "Microwave Oven");
        result.put("confidence", 0.97);
        result.put("elements", Arrays.asList(
            createElement("Steel (Box/Chassis)", 5200.0, 0.05),
            createElement("Copper (Transformer/Magnetron)", 900.0, 0.75),
            createElement("Aluminum (Heatsink)", 350.0, 0.22),
            createElement("Gold (Control Board)", 0.02, 5200.0),
            createElement("Glass (Turntable)", 1100.0, 0.01)
        ));
        result.put("totalEstimatedValue", 1122.0);
    }

    private void populateAudioEquipmentData(Map<String, Object> result) {
        result.put("detectedItem", "Audio Equipment (Amplifier/Receiver)");
        result.put("confidence", 0.92);
        result.put("elements", Arrays.asList(
            createElement("Copper (Large Transformer)", 2800.0, 0.75),
            createElement("Aluminum (Heatsinks)", 1800.0, 0.22),
            createElement("Steel (Chassis)", 3200.0, 0.05),
            createElement("Gold (Plated Jacks/PCB)", 0.25, 5200.0),
            createElement("Ferrite (Magnets)", 500.0, 0.01)
        ));
        result.put("totalEstimatedValue", 3951.0);
    }

    private void populateCableWireData(Map<String, Object> result) {
        result.put("detectedItem", "Cables & Wires");
        result.put("confidence", 0.96);
        result.put("elements", Arrays.asList(
            createElement("Copper (Conductors)", 800.0, 0.75),
            createElement("Plastic (Insulation)", 450.0, 0.02),
            createElement("Aluminum (Shielding)", 50.0, 0.22),
            createElement("Steel (Armor/Support)", 30.0, 0.05)
        ));
        result.put("totalEstimatedValue", 622.5);
    }

    private void populatePCBData(Map<String, Object> result) {
        result.put("detectedItem", "Printed Circuit Boards (PCBs)");
        result.put("confidence", 0.98);
        result.put("elements", Arrays.asList(
            createElement("Gold (Plating/Pins)", 0.20, 5200.0),
            createElement("Copper (Traces/Layers)", 150.0, 0.75),
            createElement("Silver (Solder)", 2.5, 75.0),
            createElement("Palladium (Capacitors)", 0.05, 3500.0),
            createElement("Fiberglass (Substrate)", 200.0, 0.0)
        ));
        result.put("totalEstimatedValue", 1515.0);
    }

    private Map<String, Object> createElement(String name, double weightGrams, double pricePerGram) {
        Map<String, Object> element = new HashMap<>();
        element.put("name", name);
        element.put("weightGrams", weightGrams);
        element.put("pricePerGram", pricePerGram);
        element.put("value", weightGrams * pricePerGram);
        return element;
    }
}
