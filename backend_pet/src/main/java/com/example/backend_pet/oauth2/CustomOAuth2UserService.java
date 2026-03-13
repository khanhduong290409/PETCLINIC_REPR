package com.example.backend_pet.oauth2;

import com.example.backend_pet.entity.User;
import com.example.backend_pet.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@RequiredArgsConstructor
@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
    private final UserRepository userRepository;

    @Transactional // nếu trong quá trình của function loaduser không thành công ở bất kì 1 bước nào đó thì rollback lại tất cả 
    @Override // ghi đè method mặc định của class defaultoauth2userservice
    public OAuth2User loadUser(OAuth2UserRequest userRequest) {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        String email = oAuth2User.getAttribute("email");
        String fullName = oAuth2User.getAttribute("name");
        //optional để tránh tình trạng nếu tìm không thấy thì nó sẽ thành rỗng ( không phải null )
        Optional<User> existingUser = userRepository.findByEmail(email);
        if(existingUser.isEmpty()) {
            User newUser = User.builder()
            .email(email)
            .fullName(fullName)
            .password("GOOGLE_AUTH")
            .role(User.Role.USER)
            .build();

        }
        return oAuth2User;
    }




}
