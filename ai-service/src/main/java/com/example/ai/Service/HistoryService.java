package com.example.ai.Service;

import com.example.ai.Client.CatalogClient;
import com.example.ai.Model.ReadingEvent;
import com.example.ai.Repository.ReadingEventRepository;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class HistoryService {
    private final ReadingEventRepository events;
    private final CatalogClient catalog;
    public HistoryService(ReadingEventRepository events, CatalogClient catalog) {
        this.events = events; this.catalog = catalog;
    }
    public List<Long> recentBookIds(String subject) {
        return events.findTop20ByUserSubjectOrderByCreatedAtDescIdDesc(subject).stream()
                .map(ReadingEvent::getBookId).distinct().toList();
    }
    @Transactional
    public void record(String subject, long bookId, ReadingEvent.Type type, String externalId) {
        if (subject == null || subject.isBlank() || subject.length() > 200) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã người dùng không hợp lệ.");
        }
        if (externalId != null) {
            var previous = events.findByExternalEventId(externalId);
            if (previous.isPresent()) {
                if (!previous.get().getUserSubject().equals(subject) || previous.get().getBookId() != bookId) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã sự kiện đã được sử dụng.");
                }
                return;
            }
        }
        if (catalog.findBooks(List.of(bookId)).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Sách không tồn tại.");
        }
        events.saveAndFlush(new ReadingEvent(subject, bookId, type, externalId));
    }
    @Transactional
    public void clear(String subject) { events.deleteByUserSubject(subject); }
}
