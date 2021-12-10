.PHONY: test


SHELL := /bin/bash

test:
	docker start hh-node || docker run --name hh-node  -p 8545:8545 ethereumoptimism/hardhat 
	./test/scripts/waitForHardhatNode.sh
	yarn run test

