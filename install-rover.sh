#!/bin/bash

ARCHITECTURE=$(arch)

install_from_source () {
    echo "Installing rover from source"
    curl https://sh.rustup.rs -sSf | sh -s -- --default-toolchain nightly -y
    source $HOME/.cargo/env
    cargo install --git https://github.com/apollographql/rover.git rover
}

if [ "$ARCHITECTURE" = "aarch64" ] 
then
    install_from_source
else
  npm install -g @apollo/rover
fi