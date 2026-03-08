FROM eclipse-temurin:17-jdk-alpine

WORKDIR /maky

COPY target/budgetwise-backend-1.0.0.jar maky.jar
COPY .env .env

EXPOSE 8080

CMD ["java","-jar","maky.jar"]