FROM postgres:15-alpine

ENV POSTGRES_DB=mydb
ENV POSTGRES_USER=admin
ENV POSTGRES_PASSWORD=secret

COPY init.sql /docker-entrypoint-initdb.d/