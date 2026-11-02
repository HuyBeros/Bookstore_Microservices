package com.example.ai.Model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "reading_events")
public class ReadingEvent {
    public enum Type { VIEW, FAVORITE, PURCHASE }
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 200)
    private String userSubject;
    @Column(nullable = false)
    private Long bookId;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private Type eventType;
    @Column(unique = true, length = 150)
    private String externalEventId;
    @Column(nullable = false)
    private Instant createdAt;

    protected ReadingEvent() {}
    public ReadingEvent(String subject, long bookId, Type type, String externalId) {
        this.userSubject = subject; this.bookId = bookId; this.eventType = type;
        this.externalEventId = externalId; this.createdAt = Instant.now();
    }
    public Long getBookId() { return bookId; }
    public String getUserSubject() { return userSubject; }
    public Type getEventType() { return eventType; }
}
