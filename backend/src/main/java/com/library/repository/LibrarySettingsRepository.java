package com.library.repository;

import com.library.entity.LibrarySettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface LibrarySettingsRepository extends JpaRepository<LibrarySettings, Long> {
    List<LibrarySettings> findByCategory(String category);
    Optional<LibrarySettings> findBySettingKey(String settingKey);
}
