#!/bin/bash

export DEBUG="*"

cd server
yarn prisma:generate
cd ..
yarn pretty-quick