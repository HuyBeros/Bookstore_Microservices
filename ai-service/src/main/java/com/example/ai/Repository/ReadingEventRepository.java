package com.example.ai.Repository;

import com.example.ai.Model.ReadingEvent;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReadingEventRepository extends JpaRepository<ReadingEvent, Long> {
    List<ReadingEvent> findTop20ByUserSubjectOrderByCreatedAtDescIdDesc(String subject);
    Optional<ReadingEvent> findByExternalEventId(String externalId);
    void deleteByUserSubject(String subject);
}
