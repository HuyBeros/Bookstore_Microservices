package com.example.ai.Provider;

import com.example.ai.Dto.AdminBriefing.Priority;
import com.google.genai.Client;
import com.google.genai.types.HttpOptions;
import com.google.genai.types.HttpRetryOptions;
import jakarta.annotation.PreDestroy;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.ToolCallingAdvisor;
import org.springframework.ai.google.genai.GoogleGenAiChatModel;
import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.model.tool.ToolCallingManager;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.retry.RetryPolicy;
import org.springframework.core.retry.RetryTemplate;
import org.springframework.stereotype.Component;

@Component
public class AdminPriorityProvider {
    private final Client gemini;
    private final ChatClient chat;

    public AdminPriorityProvider(@Value("${ai.gemini.api-key:}") String apiKey,
                                 @Value("${ai.gemini.model:}") String model,
                                 @Value("${ai.gemini.base-url}") String baseUrl) {
        if (apiKey.isBlank() || model.isBlank()) {
            gemini = null;
            chat = null;
            return;
        }
        gemini = Client.builder().apiKey(apiKey).httpOptions(HttpOptions.builder()
                .baseUrl(baseUrl).timeout(4000).retryOptions(HttpRetryOptions.builder().attempts(1)).build()).build();
        var options = GoogleGenAiChatOptions.builder().model(model).maxOutputTokens(512).build();
        var manager = ToolCallingManager.builder().maxCallsPerTool(1).maxTotalToolCalls(2).build();
        var chatModel = GoogleGenAiChatModel.builder().genAiClient(gemini).options(options)
                .toolCallingManager(manager).retryTemplate(new RetryTemplate(RetryPolicy.builder().maxRetries(0).build()))
                .build();
        chat = ChatClient.builder(chatModel)
                .defaultAdvisors(ToolCallingAdvisor.builder().toolCallingManager(manager).build()).build();
    }

    public Priority choose(long orders, int lowStock, long outOfStock) {
        if (chat == null) return null;
        try {
            var tools = new BriefingTools(orders, lowStock, outOfStock);
            String result = chat.prompt().system("""
                    Bạn hỗ trợ quản trị nhà sách. Gọi cả hai công cụ rồi chọn một việc cần xem trước.
                    Ưu tiên đơn chờ xác nhận, trừ khi có sách đã hết hàng cần kiểm tra.
                    Chỉ trả về một mã ORDERS hoặc STOCK, không kèm nội dung khác.
                    """).user("Hôm nay cần xử lý gì trước?").tools(tools).call().content();
            if (!tools.readOrders || !tools.readStock || result == null) return null;
            return switch (result.strip()) {
                case "ORDERS" -> Priority.ORDERS;
                case "STOCK" -> Priority.STOCK;
                default -> null;
            };
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    @PreDestroy
    void close() {
        if (gemini != null) gemini.close();
    }

    private static final class BriefingTools {
        private final long orders;
        private final int lowStock;
        private final long outOfStock;
        private boolean readOrders;
        private boolean readStock;

        private BriefingTools(long orders, int lowStock, long outOfStock) {
            this.orders = orders;
            this.lowStock = lowStock;
            this.outOfStock = outOfStock;
        }

        @Tool(description = "Lấy tổng số đơn hàng đang chờ xác nhận")
        public PendingOrders getPendingOrders() {
            readOrders = true;
            return new PendingOrders(orders);
        }

        @Tool(description = "Lấy số đầu sách sắp hết và số đầu sách đã hết hàng")
        public LowStockBooks getLowStockBooks() {
            readStock = true;
            return new LowStockBooks(lowStock, outOfStock);
        }
    }

    private record PendingOrders(long count) {}
    private record LowStockBooks(int lowStock, long outOfStock) {}
}
