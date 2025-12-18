package com.ewaste.ewaste_backend.controller;

import com.ewaste.ewaste_backend.model.PickupRequest;
import com.ewaste.ewaste_backend.model.User;
import com.ewaste.ewaste_backend.repository.PickupRequestRepository;
import com.ewaste.ewaste_backend.repository.UserRepository;
import com.ewaste.ewaste_backend.service.PickupRequestService;
import com.ewaste.ewaste_backend.util.TableCreator;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/razorpay")
@CrossOrigin
public class RazorpayController {

    @Value("${razorpay.key}")
    private String razorpayKey;

    @Value("${razorpay.secret}")
    private String razorpaySecret;

    @Autowired
    private PickupRequestService pickupRequestService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TableCreator tableCreator;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostMapping("/create-order")
    @ResponseBody // Ensure the return value is serialized as the response body
    public String createOrder(@RequestBody Map<String, Object> data) {
        try {
            RazorpayClient razorpay = new RazorpayClient(razorpayKey, razorpaySecret);
            int amount = 4000; // Default amount
            if (data.containsKey("amount")) {
                // Razorpay expects amount in paisa, ensure it's multiplied by 100
                amount = (int) (Double.parseDouble(data.get("amount").toString()) * 100);
            }

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amount);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "order_rcptid_" + System.currentTimeMillis());

            Order order = razorpay.orders.create(orderRequest);
            return order.toJson().toString(); // Ensure valid JSON string is returned
        } catch (Exception e) {
            e.printStackTrace();
            // Return a proper JSON error response
            return "{\"error\":\"Order creation failed.\", \"message\":\"" + e.getMessage() + "\"}";
        }
    }

    @Transactional
    @PostMapping(value = "/success", consumes = {"multipart/form-data"})
    public String paymentSuccess(
            @RequestParam("userId") String userId,
            @RequestParam("date") String date,
            @RequestParam("time") String time,
            @RequestParam("address") String address,
            @RequestParam("pincode") String pincode,
            @RequestParam("city") String city,
            @RequestParam("state") String state,
            @RequestParam("schedulerName") String schedulerName,
            @RequestParam("phone") String phone,
            @RequestParam("email") String email,
            @RequestParam(value = "status", required = false, defaultValue = "Pending") String status,
            @RequestParam(value = "wasteType", required = false) String wasteType,
            @RequestPart(value = "image", required = false) MultipartFile imageFile
    ) {
        try {
            PickupRequest request = new PickupRequest();
            request.setUserId(Long.parseLong(userId));
            request.setDate(date);
            request.setTime(time);
            request.setAddress(address);
            request.setPincode(pincode);
            request.setCity(city);
            request.setState(state);
            request.setSchedulerName(schedulerName);
            request.setPhone(phone);
            request.setEmail(email);
            request.setStatus(status);
            request.setWasteType(wasteType);

            byte[] imageData = null;
            if (imageFile != null && !imageFile.isEmpty()) {
                imageData = imageFile.getBytes();
                request.setImageData(imageData);
            }

            pickupRequestService.savePickupRequest(request);

            Long userIdLong = Long.parseLong(userId);
            Optional<User> userOptional = userRepository.findById(userIdLong);

            if (userOptional.isPresent()) {
                User user = userOptional.get();
                tableCreator.createUserHistoryTable(user.getId(), user.getFullname());
                String tableName = tableCreator.getTableName(user.getId(), user.getFullname());

                String sql = "INSERT INTO `" + tableName + "` (" +
                        "`address`, `city`, `date`, `email`, `phone`, `pincode`, " +
                        "`scheduler_name`, `state`, `status`, `time`, `user_id`, `waste_type`, `image_data`) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                jdbcTemplate.update(sql,
                        address,
                        city,
                        date,
                        email,
                        phone,
                        pincode,
                        schedulerName,
                        state,
                        status,
                        time,
                        userIdLong,
                        wasteType,
                        imageData
                );
            }

            return "{\"status\": \"success\"}";

        } catch (Exception e) {
            e.printStackTrace();
            return "{\"status\": \"error\", \"message\": \"" + e.getMessage() + "\"}";
        }
    }
}