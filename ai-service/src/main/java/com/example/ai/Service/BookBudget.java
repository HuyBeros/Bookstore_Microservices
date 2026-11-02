package com.example.ai.Service;

import com.example.ai.Dto.AdviceRequest;
import com.example.ai.Dto.CatalogBook;
import java.math.BigDecimal;
import java.util.regex.Pattern;

public record BookBudget(BigDecimal minimum, BigDecimal maximum) {
    private static final String MONEY = "([0-9]+(?:[.,][0-9]+)*)\\s*(trieu|tr|nghin|ngan|k|vnd|dong|d)?";
    private static final Pattern RANGE = Pattern.compile("(?:tu|khoang)\\s*" + MONEY + "\\s*(?:den|toi|-)\\s*" + MONEY + "(?:\\b|$)");
    private static final Pattern MAX = Pattern.compile("(?:duoi|khong qua|toi da|it hon|re hon|ngan sach(?: la)?|tam gia|tam)\\s*" + MONEY + "(?:\\b|$)");
    private static final Pattern MIN = Pattern.compile("(?:tren|toi thieu|it nhat)\\s*" + MONEY + "(?:\\b|$)");
    public boolean accepts(CatalogBook book) {
        return book.price() != null && (minimum == null || book.price().compareTo(minimum) >= 0)
                && (maximum == null || book.price().compareTo(maximum) <= 0);
    }
    public static BookBudget from(AdviceRequest request) {
        if (normalize(request.message()).matches(".*(?:bo gioi han|khong gioi han|bat ke gia|khong quan tam gia).*")) return new BookBudget(null, null);
        var current = parse(request.message());
        if (current.minimum != null || current.maximum != null) return current;
        if (normalize(request.message()).matches(".*(?:cuon|quyen|sach|re hon|goi y|khac|them).*")) {
            for (int i = request.history().size() - 1; i >= 0; i--) {
                var turn = request.history().get(i);
                if (turn.role() == AdviceRequest.Role.USER) {
                    var previous = parse(turn.content());
                    if (previous.minimum != null || previous.maximum != null) return previous;
                }
            }
        }
        return current;
    }
    public static BookBudget parse(String text) {
        text = normalize(text);
        var range = RANGE.matcher(text);
        if (range.find()) {
            String lowerUnit = range.group(2) == null ? range.group(4) : range.group(2);
            return new BookBudget(amount(range.group(1), lowerUnit), amount(range.group(3), range.group(4)));
        }
        var max = MAX.matcher(text); var min = MIN.matcher(text);
        BigDecimal lower = null, upper = null;
        if (min.find()) lower = amount(min.group(1), min.group(2)).add(min.group().startsWith("tren") ? BigDecimal.ONE : BigDecimal.ZERO);
        if (max.find()) upper = amount(max.group(1), max.group(2)).subtract(max.group().matches("^(?:duoi|it hon|re hon).*" ) ? BigDecimal.ONE : BigDecimal.ZERO);
        return new BookBudget(lower, upper);
    }
    private static BigDecimal amount(String number, String unit) {
        boolean scaled = unit != null && unit.matches("k|nghin|ngan|trieu|tr");
        String cleaned = scaled && number.matches("\\d+[.,]\\d{1,2}") ? number.replace(',', '.') : number.replaceAll("[.,]", "");
        var value = new BigDecimal(cleaned);
        return value.multiply(BigDecimal.valueOf(unit == null ? 1 : unit.matches("trieu|tr") ? 1000000 : unit.matches("k|nghin|ngan") ? 1000 : 1));
    }
    public static String normalize(String text) {
        return com.example.ai.Util.BookText.normalize(text);
    }
}
