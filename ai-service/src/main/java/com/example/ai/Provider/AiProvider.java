package com.example.ai.Provider;

import com.example.ai.Dto.AdviceMode;
import com.example.ai.Dto.AdviceRequest;
import com.example.ai.Dto.AiAnswer;
import com.example.ai.Dto.CatalogBook;

import java.util.List;
import java.util.concurrent.CompletionStage;

public interface AiProvider {
    CompletionStage<AiAnswer> advise(AdviceRequest request, List<CatalogBook> candidates,
                                   List<Long> recentBookIds, AdviceMode mode);
}
