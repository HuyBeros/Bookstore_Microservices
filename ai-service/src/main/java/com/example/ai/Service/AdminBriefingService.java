package com.example.ai.Service;

import com.example.ai.Client.AdminOperationsClient;
import com.example.ai.Client.AdminOperationsClient.Stock;
import com.example.ai.Client.CatalogClient;
import com.example.ai.Dto.AdminBriefing;
import com.example.ai.Dto.AdminBriefing.Priority;
import com.example.ai.Dto.AdminBriefing.StockAlert;
import com.example.ai.Dto.CatalogBook;
import com.example.ai.Provider.AdminPriorityProvider;
import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminBriefingService {
    private static final int THRESHOLD = 5;
    private final AdminOperationsClient operations;
    private final CatalogClient catalog;
    private final AdminPriorityProvider ai;

    public AdminBriefingService(AdminOperationsClient operations, CatalogClient catalog, AdminPriorityProvider ai) {
        this.operations = operations;
        this.catalog = catalog;
        this.ai = ai;
    }

    public AdminBriefing create(String token) {
        Long pendingOrders = operations.pendingOrders(token);
        List<Stock> lowStock = operations.lowStock(token, THRESHOLD);
        Instant checkedAt = Instant.now();
        Integer stockCount = lowStock == null ? null : lowStock.size();
        List<StockAlert> alerts = lowStock == null ? List.of() : stockAlerts(lowStock);
        boolean hasOrders = pendingOrders != null && pendingOrders > 0;
        boolean hasStockAlerts = stockCount != null && stockCount > 0;
        Priority suggested = null;
        if (hasOrders && hasStockAlerts) {
            long outOfStock = lowStock.stream().filter(stock -> stock.quantity() == 0).count();
            suggested = ai.choose(pendingOrders, stockCount, outOfStock);
        }
        Priority priority = suggested;
        if (priority == null) {
            priority = hasOrders ? Priority.ORDERS : hasStockAlerts ? Priority.STOCK : Priority.NONE;
        }
        return new AdminBriefing(checkedAt, pendingOrders, stockCount, THRESHOLD, alerts, priority, suggested != null);
    }

    private List<StockAlert> stockAlerts(List<Stock> lowStock) {
        var first = lowStock.stream().sorted(Comparator.comparingInt(Stock::quantity).thenComparing(Stock::bookId))
                .limit(5).toList();
        var titles = new HashMap<Long, String>();
        try {
            for (CatalogBook book : catalog.findBooks(first.stream().map(Stock::bookId).toList())) {
                titles.put(book.id(), book.title());
            }
        } catch (ResponseStatusException ignored) {
            // Stock remains usable by book ID when catalog metadata is unavailable.
        }
        return first.stream().map(stock -> new StockAlert(stock.bookId(), titles.get(stock.bookId()), stock.quantity())).toList();
    }
}
