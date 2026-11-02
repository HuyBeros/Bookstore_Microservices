# Project Rules for StudyMate

## General Conventions
1. Always maintain clean layer separation: Controller -> Service -> Repository -> Entity.
2. Always wrap API responses in `ApiResponse<T>`.
3. Never hardcode credentials; rely on `.env` and environment variables.
4. When writing PostgreSQL queries with custom ENUMs or JSONB, verify compatibility with `stringtype=unspecified` and `@JdbcTypeCode(SqlTypes.JSON)`.
5. Keep unit & integration tests passing (`mvn test`).
