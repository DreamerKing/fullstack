docker run -p 5423:5423 -d \
 --name king-postgres \
 -e POSTGRES_PASSWORD=794838927 \
 -e PGDATA=/var/lib/postgresql/data/pgdata \
 -e POSTGRES_HOST_AUTH_METHOD=trust \
 -v /Users/mockuai/postgresql/data:/var/lib/postgresql/data \
 postgres

    docker run --name king-mysql \
    -p 3306:3306 \
    -e MYSQL_ROOT_PASSWORD=794838927 \
    -e MYSQL_USER=king \
    -e MYSQL_PASSWORD=794838927 \
    -v /Users/mockuai/mysql/data:/var/lib/mysql -d mysql \ --default-authentication-plugin=mysql_native_password

    docker pull --platform linux/x86_64  mysql


    docker run --name king-redis -v /Users/mockuai/redis/data:/data -p 6379:6379 -d redis redis-server --appendonly yes

解决 myql🔗 问题

```sql
use mysql;
-- select * from user;
ALTER USER 'king'@'%' IDENTIFIED WITH mysql_native_password by '794838927';
-- SELECT PLUGIN FROM mysql.`user` WHERE user = 'king';
```

```
npx gen-env-types .env -o src/env.d.ts -e .
```
