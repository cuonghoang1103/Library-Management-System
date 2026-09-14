package com.library.dto;

import com.library.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserDTO {
    private Long id;
    
    @NotBlank(message = "Username is required")
    private String username;
    
    private String password;
    
    @NotBlank(message = "Full name is required")
    private String fullName;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
    
    private String phoneNumber;
    
    @NotNull(message = "Role is required")
    private Role role;
    
    private boolean active;
}
