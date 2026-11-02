FROM eclipse-temurin:21-jre
WORKDIR /app
COPY target/ai-service-0.0.1-SNAPSHOT.jar app.jar
USER 10001
EXPOSE 8085
ENTRYPOINT ["java", "-jar", "app.jar"]
