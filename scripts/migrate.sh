#!/bin/bash

echo $DATABASE_URL
cd server
yarn prisma:migrate