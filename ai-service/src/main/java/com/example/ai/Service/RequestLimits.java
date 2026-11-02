package com.example.ai.Service;

import java.time.Clock;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Semaphore;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class RequestLimits {
    private record Window(long minute, int count) {}
    private final Map<String, Window> windows = new HashMap<>();
    private final Semaphore inFlight = new Semaphore(8);
    private final Clock clock;
    public RequestLimits() { this(Clock.systemUTC()); }
    RequestLimits(Clock clock) { this.clock = clock; }

    public synchronized void acquire(String subject) {
        long minute = clock.millis() / 60000;
        windows.entrySet().removeIf(entry -> entry.getValue().minute() != minute);
        Window previous = windows.getOrDefault(subject, new Window(minute, 0));
        if (previous.count() >= 20 || windows.size() >= 10000 || !inFlight.tryAcquire()) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Quá nhiều yêu cầu, vui lòng thử lại sau.");
        }
        windows.put(subject, new Window(minute, previous.count() + 1));
    }
    public void release() { inFlight.release(); }
}
