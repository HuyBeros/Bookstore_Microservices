package com.example.ai.Util;

import java.text.Normalizer;
import java.util.Locale;

public final class BookText {
    private BookText() {}
    public static String normalize(String text) {
        return Normalizer.normalize(text.toLowerCase(Locale.ROOT).replace('đ', 'd'), Normalizer.Form.NFD).replaceAll("\\p{M}", "");
    }
}
