docker run  -p 5423:5423 -d \
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
    -v /Users/mockuai/mysql/data:/var/lib/mysql -d mysql


    docker run --name king-redis -v /Users/mockuai/redis/data:/data -p 6379:6379 -d redis redis-server --appendonly yes

