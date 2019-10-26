#!/bin/bash

cd server

yarn
yarn prisma:generate

cd ..

yarn pretty-quick