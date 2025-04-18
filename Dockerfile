FROM ubuntu:noble
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update
RUN apt-get upgrade -y
RUN apt-get update
RUN apt-get upgrade -y

# Python

RUN apt-get remove -y python3.12
RUN apt-get install -y software-properties-common
RUN add-apt-repository ppa:deadsnakes/ppa -y
RUN apt-get update -y
RUN apt-get install -y python3.11
RUN python3 --version
RUN apt-get install -y python3-pip

# Install python packages (depdendencies for unified planning)

RUN python3 -m pip install pyparser --break-system-packages
RUN python3 -m pip install networkx --break-system-packages
RUN python3 -m pip install ConfigSpace --break-system-packages
RUN python3 -m pip install "numpy<2" --break-system-packages

RUN python3 -m pip install grpcio-tools --break-system-packages

# "Activate" development version of unified planning package
# (copy-pasted / adapted from `beluga/aries-beluga/planning/unified/dev.env`)

ENV DIR="/usr/src/beluga/aries-beluga/planning/unified"
# Allow using the `up_aries` plugin directly from this repository
ENV PYTHONPATH="${DIR}/plugin:"
# Enable automatic recompilation of the server
ENV UP_ARIES_DEV="true"
# Use the python modules of the unified planning library and test cases directly from the git submodules of this repository
ENV PYTHONPATH="${DIR}/deps/unified-planning/up_test_cases:${PYTHONPATH}"
ENV PYTHONPATH="${DIR}/deps/unified-planning:${PYTHONPATH}"

# Curl (needed to install Rust and Node.js)

RUN apt-get install -y curl

# Rust

RUN curl https://sh.rustup.rs -sSf | bash -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
RUN cargo --version

# Copy beluga repository (w/ submodules)

RUN mkdir -p /usr/src/beluga
COPY beluga/ /usr/src/beluga/

# Build the approriate Rust executables

WORKDIR /usr/src/beluga/aries-beluga/
#RUN cargo build --bin up-server --release
RUN cargo build --bin beluga --release

# Node.js

WORKDIR /usr/src/app
RUN curl -sL https://deb.nodesource.com/setup_22.x | bash -
RUN apt-get install -y nodejs

# Copy web service code

RUN mkdir -p /usr/src/app/src
COPY src/ /usr/src/app/src
COPY package-lock.json/ /usr/src/app
COPY package.json/ /usr/src/app
COPY tsconfig.json/ /usr/src/app
WORKDIR /usr/src/app
RUN npm install
RUN npm install -g ts-node

# Run

#EXPOSE 3334

ENV EXPLAINER_SERVICE_PLANNER="/usr/src/beluga/beluga.py"

RUN mkdir -p /usr/temp
ENV TEMP_RUN_FOLDERS="/usr/temp"

WORKDIR /usr/src/app
CMD ["npm", "start"]