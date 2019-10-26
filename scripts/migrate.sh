#!/bin/bash

cd server

yarn
yarn prisma:generate
yarn prisma:migrate