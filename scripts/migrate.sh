#!/bin/bash

echo "DB url: $DATABASE_URL"
export POSTGRESQL_URL="${DATABASE_URL/postgres\:\/\//postgresql://}"
echo "Fixed URL: $POSTGRESQL_URL"

cd server
yarn prisma:migrate