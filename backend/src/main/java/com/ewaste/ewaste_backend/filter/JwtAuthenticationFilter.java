package com.ewaste.ewaste_backend.filter;

import com.ewaste.ewaste_backend.service.JwtService;
import com.ewaste.ewaste_backend.service.UserAuthService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserAuthService userAuthService;

    /**
     * Intercepts incoming HTTP requests to validate JWT tokens.
     * If a valid token is found, it authenticates the user in the SecurityContext.
     */
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;

        // 1. Check if Authorization header exists and starts with "Bearer "
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // If no JWT or not a Bearer token, continue without authentication
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Extract JWT token (skip "Bearer " prefix)
        jwt = authHeader.substring(7);

        // 3. Extract username from JWT
        username = jwtService.extractUsername(jwt);

        // 4. If username is found and no authentication is currently set in SecurityContext
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            // Load UserDetails for the extracted username
            UserDetails userDetails = this.userAuthService.loadUserByUsername(username);

            // 5. Validate the token against the loaded UserDetails
            if (jwtService.isTokenValid(jwt, userDetails)) {
                // If valid, create an Authentication token
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null, // Credentials are not stored here (already authenticated via token)
                        userDetails.getAuthorities() // User's roles/authorities
                );
                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request) // Set request details
                );
                // 6. Set the authentication in the SecurityContext, so Spring Security knows the user is authenticated
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // 7. Continue with the rest of the filter chain
        filterChain.doFilter(request, response);
    }
}
