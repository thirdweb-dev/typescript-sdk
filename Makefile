.PHONY: build


SHELL := /bin/bash

build:
	yarn run build

test: FORCE
	docker start hh-node || docker run --name hh-node -d -p 8545:8545 ethereumoptimism/hardhat 
	./test/scripts/waitForHardhatNode.sh
	yarn run build
	yarn run test:all

test-fork: FORCE
	docker build . -t hardhat-mainnet-fork-ts
	docker start hardhat-node || docker run --name hardhat-node -d -p 8545:8545 -e SDK_ALCHEMY_KEY=${SDK_ALCHEMY_KEY} hardhat-mainnet-fork-ts
	sudo bash ./test/scripts/waitForHardhatNode.sh
	yarn run build
	yarn run test:all
	docker stop hardhat-node
	docker rm hardhat-node

FORCE: ;
