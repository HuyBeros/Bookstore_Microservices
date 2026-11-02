package com.example.ai.Service;

import com.example.ai.Dto.AdviceRequest;
import com.example.ai.Dto.CatalogBook;
import java.util.*;
import java.util.regex.Pattern;

/** Explicit reading preferences constrain public Catalog metadata; the model cannot override them. */
public final class BookGenre {
    private enum Topic {
        DETECTIVE("trinh tham|kinh di", "trinh tham|kinh di"),
        CHILDREN("thieu nhi|tre em", "thieu nhi|sach tranh"),
        NOVEL("tieu thuyet", "tieu thuyet|van hoc hien dai|van hoc kinh dien|viet nam danh tac|trinh tham|khoa hoc vien tuong|ky ao"),
        TECHNOLOGY("cong nghe|tri tue nhan tao|lap trinh|hoc may", "cong nghe|tri tue nhan tao"),
        BUSINESS("kinh doanh|kinh te|quan tri|dau tu", "kinh doanh|quan tri"),
        PSYCHOLOGY("tam ly|ky nang song", "tam ly|ky nang song"),
        PHILOSOPHY("triet hoc", "triet hoc"),
        HISTORY("lich su|su hoc", "su hoc|dia chinh tri"),
        SCIENCE("khoa hoc", "khoa hoc|doi song"),
        LITERATURE("van hoc", "van hoc|trinh tham|ky ao");
        final Pattern words, category, negative;
        Topic(String words, String category) {
            this.words = Pattern.compile("\\b(?:" + words + ")\\b");
            this.category = Pattern.compile(category);
            this.negative = Pattern.compile("\\b(?:khong(?:\\s+(?:thich|muon))?|dung|tranh)\\s+(?:(?:goi y|chon|tim|doc)\\s+)?(?:sach\\s+)?(?:" + words + ")\\b");
        }
    }
    private final Topic preferred;
    private final Set<Topic> excluded;
    private BookGenre(Topic preferred, Set<Topic> excluded) { this.preferred = preferred; this.excluded = excluded; }
    public boolean constrained() { return preferred != null || !excluded.isEmpty(); }
    public static BookGenre from(AdviceRequest request) {
        String text = BookBudget.normalize(request.message());
        if (text.matches(".*(?:cuon nao|cuon khac|quyen nao|re hon|goi y them|cuon thu|noi dung|sach nao).*")) {
            var previous = request.history().stream().filter(turn -> turn.role() == AdviceRequest.Role.USER).reduce((a, b) -> b);
            // An explicit genre in the current turn replaces the previous one.
            if (Arrays.stream(Topic.values()).noneMatch(topic -> topic.words.matcher(BookBudget.normalize(request.message())).find()) && previous.isPresent()) {
                text = BookBudget.normalize(previous.get().content()) + " " + text;
            }
        }
        var excluded = EnumSet.noneOf(Topic.class);
        for (var topic : Topic.values()) {
            if (topic.negative.matcher(text).find()) { excluded.add(topic); text = topic.negative.matcher(text).replaceAll(" "); }
        }
        Topic selected = null;
        for (var topic : Topic.values()) if (topic.words.matcher(text).find()) { selected = topic; break; }
        return new BookGenre(selected, excluded);
    }
    public boolean accepts(CatalogBook book) {
        String category = book.category() == null ? "" : BookBudget.normalize(book.category().name());
        // A broad literature category is not proof of literary form (it includes essays/short-story collections).
        if (preferred == Topic.NOVEL && !category.contains("tieu thuyet")) {
            String description = BookBudget.normalize(book.title() + " " + (book.description() == null ? "" : book.description()));
            if (!description.contains("tieu thuyet")) return false;
        }
        return (preferred == null || preferred.category.matcher(category).find())
                && excluded.stream().noneMatch(topic -> topic.category.matcher(category).find());
    }
}
