CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE book_vectors (
    book_id BIGINT NOT NULL,
    model VARCHAR(100) NOT NULL,
    dimensions INTEGER NOT NULL CHECK (dimensions BETWEEN 1 AND 3072),
    content_hash VARCHAR(64) NOT NULL,
    content TEXT NOT NULL,
    embedding vector NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (book_id, model, dimensions),
    CHECK (vector_dims(embedding) = dimensions)
);
