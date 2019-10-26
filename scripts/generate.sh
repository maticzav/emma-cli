#!/bin/bash

cd server
yarn prisma:generate
cd ..
yarn pretty-quick