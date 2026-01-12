docker exec -i mssql_db /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "StrongP@ssw0rd!" -C < main.sql
