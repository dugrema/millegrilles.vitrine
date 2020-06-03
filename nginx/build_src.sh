#!/usr/bin/env bash

rm -rf react_build/

cd ..
./build_src.sh

cp -r react_build/ static/
