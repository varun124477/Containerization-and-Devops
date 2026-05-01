## Experiment 2:- Docker Installation, Configuration, and Running Images

*Step 1: Pull Image*

bash
docker --version

![Check Version](./Images/Screenshot%202026-02-02%20193721.png)


*Step 2: Run Container with Port Mapping*

bash
docker run -d -p 8080:80 nginx

![Run nginx container](./Images/Screenshot%202026-02-02%20194005.png)


*Step 3: Verify Running Containers*

bash
docker ps

![Verify container](./Images/Screenshot%202026-02-02%20194246.png)


*Step 4: Stop Container*

bash
docker stop <container_id>

![Stop Container](./Images/Screenshot%202026-02-02%20194540.png)


*Step 5: Remove Container*

bash
docker rm <container_id>

![Remove Container](./Images/Screenshot%202026-02-02%20194600.png)


*Step 5: Remove Image*

bash
docker rmi nginx

![Remove Images](./Images/Screenshot%202026-02-02%20194650.png)


*Result*
Docker images were successfully pulled, containers executed, and lifecycle commands performed.