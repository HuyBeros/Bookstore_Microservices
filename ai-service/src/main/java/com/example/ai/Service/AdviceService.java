package com.example.ai.Service;

import com.example.ai.Client.CatalogClient;
import com.example.ai.Client.InventoryClient;
import com.example.ai.Dto.*;
import com.example.ai.Provider.AiProvider;
import java.util.*;
import java.util.concurrent.*;
import org.springframework.stereotype.Service;

@Service
public class AdviceService {
    private final CatalogClient catalog;
    private final AiProvider provider;
    private final HistoryService history;
    private final RetrievalService retrieval;
    private final InventoryClient inventory;
    public AdviceService(CatalogClient catalog, AiProvider provider, HistoryService history,
                         RetrievalService retrieval, InventoryClient inventory) {
        this.catalog = catalog; this.provider = provider; this.history = history;
        this.retrieval = retrieval; this.inventory = inventory;
    }
    public CompletionStage<AdviceResponse> advise(String subject, AdviceRequest request, AdviceMode mode) {
        String normalized = BookBudget.normalize(request.message()).strip();
        if (normalized.matches("(?:xin chao|chao|hello|hi|cam on|thank you)[!.,\\s]*")) {
            return CompletableFuture.completedFuture(new AdviceResponse(
                    "Chào bạn! Bạn thích thể loại nào, đang muốn đọc về điều gì và có khoảng ngân sách bao nhiêu? Mình sẽ tìm sách trong nhà sách cho bạn.",
                    List.of(), false, List.of(), "none", List.of()));
        }
        if (normalized.matches(".*(?:phi giao hang|chinh sach doi tra|phi ship|thoi gian giao hang).*")) {
            return CompletableFuture.completedFuture(new AdviceResponse(
                    "Mình đang hỗ trợ tư vấn sách. Bạn vui lòng xem chính sách giao hàng, đổi trả tại website hoặc liên hệ nhà sách để được xác nhận điều kiện áp dụng.",
                    List.of(), false, List.of(), "none", List.of()));
        }
        List<Long> recentIds = history.recentBookIds(subject);
        var result = retrieval.retrieve(request, recentIds);
        var candidates = result.books();
        if (candidates.isEmpty()) return CompletableFuture.completedFuture(new AdviceResponse(
                "Mình chưa tìm được sách phù hợp với các điều kiện này. Bạn có thể cho biết thêm chủ đề, tác giả hoặc điều chỉnh ngân sách không?",
                List.of(), false, List.of(), result.mode(), List.of()));
        var before = inventory.quantities(candidates.stream().map(CatalogBook::id).toList());
        var context = candidates.stream().map(b -> b.withStock(before.get(b.id()))).toList();
        return provider.advise(request, context, recentIds, mode).handle((answer, failure) -> {
            boolean degraded = failure != null || answer == null || answer.bookIds() == null
                    || answer.answer() == null || answer.answer().isBlank();
            var allowed = candidates.stream().map(CatalogBook::id).collect(java.util.stream.Collectors.toSet());
            if (!degraded && answer.bookIds().stream().anyMatch(id -> id == null || !allowed.contains(id))) degraded = true;
            List<Long> ids = degraded ? candidates.stream().map(CatalogBook::id).limit(request.limit()).toList()
                    : answer.bookIds().stream().distinct().limit(request.limit()).toList();
            var current = catalog.findBooks(ids);
            var stocks = inventory.quantities(ids);
            var budget = BookBudget.from(request);
            var genre = BookGenre.from(request);
            boolean stockQuestion = normalized.matches(".*(?:ton kho|con bao nhieu|het hang|con hang).*" );
            var byId = new HashMap<Long, CatalogBook>();
            current.stream().filter(budget::accepts).filter(genre::accepts).filter(b -> stockQuestion || !Integer.valueOf(0).equals(stocks.get(b.id())))
                    .forEach(b -> byId.put(b.id(), b.withStock(stocks.get(b.id()))));
            var ordered = ids.stream().map(byId::get).filter(Objects::nonNull).toList();
            if (ordered.size() != ids.size()) degraded = true;
            String message = degraded
                    ? "Đây là các sách tham khảo từ danh mục hiện tại. Mình chưa thể hoàn tất phần tư vấn AI; bạn có thể kiểm tra thông tin ở thẻ sách bên dưới."
                    : answer.answer().replaceAll("(?im)^\\s*Sách\\s+đã\\s+hiển\\s+thị\\s*:.*(?:\\R|$)", "")
                            .replaceAll("\\[book:\\d{1,18}\\]", "").strip();
            if (message.isBlank()) message = "Bạn có thể xem các sách phù hợp trong thẻ bên dưới.";
            // Prices and quantities belong to fresh server-rendered cards, never unverified model prose.
            if (!degraded && message.matches("(?is).*\\d[\\d., ]*\\s*(?:₫|đồng|vnd|nghìn|ngàn|triệu|đ\\b).*")) {
                message = "Bạn có thể tham khảo các cuốn sách bên dưới. Giá và tình trạng hàng đã được cập nhật trên từng thẻ sách.";
            }
            if (ordered.isEmpty() && !ids.isEmpty()) message = "Thông tin sách vừa thay đổi hoặc sách không còn phù hợp với điều kiện hiện tại. Bạn thử điều chỉnh nhu cầu để mình tìm lại nhé.";
            var notices = new ArrayList<String>();
            if (ordered.stream().anyMatch(b -> b.stock() == null)) notices.add("Chưa xác minh được tồn kho. Vui lòng kiểm tra tại trang sách trước khi đặt hàng.");
            if ("keyword".equals(result.mode())) notices.add("Phạm vi tìm sách đang bị hạn chế. Bạn có thể thử nêu rõ tên sách hoặc tác giả.");
            else if (result.partialIndex()) notices.add("Nhà sách đang cập nhật danh mục tư vấn; một số sách có thể chưa xuất hiện.");
            var sources = ordered.stream().map(b -> new AdviceResponse.Source(b.id(), b.title(), "/books/" + b.id())).toList();
            return new AdviceResponse(message, ordered, degraded, sources, result.mode(), List.copyOf(notices));
        });
    }
}
