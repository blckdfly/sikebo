# Sikebo API - V1

How to use?

1. ```bash
   docker buildx build --platform linux/amd64 -t [docker_username]/sikebo-api:[tag] --push .
   ```
2. ```bash
   docker run -d --name sikebo-node1 -p 6001:3000 -e CURRENT_NODE_URL=[node1_subdomain] -t [docker_username]/sikebo-api:[tag]
   docker run -d --name sikebo-node2 -p 6002:3000 -e CURRENT_NODE_URL=[node2_subdomain] -t [docker_username]/sikebo-api:[tag]
   docker run -d --name sikebo-node3 -p 6003:3000 -e CURRENT_NODE_URL=[node3_subdomain] -t [docker_username]/sikebo-api:[tag]
   ```
