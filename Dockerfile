FROM node:14-buster

WORKDIR /code/hardhat

COPY hardhat.config.js /code/hardhat/hardhat.config.js
COPY /test/scripts/package.json /code/hardhat/package.json

RUN yarn

COPY /test/scripts/startHardhat.sh /code/hardhat/startHardhat.sh
RUN chmod +x /code/hardhat/startHardhat.sh

ENTRYPOINT ["/code/hardhat/startHardhat.sh"]