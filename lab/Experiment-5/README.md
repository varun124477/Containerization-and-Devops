```markdown
## Experiment 5: Docker Volumes, Environment Variables, Monitoring & Networks

### Aim
To master Docker volumes for persistent data, configure containers with environment variables, monitor resource usage and logs, and set up custom bridge networks for inter‑container communication.

### Pre‑requisites
- Docker installed (WSL / Ubuntu environment)
- Basic Linux command line
- Familiarity with `docker run`, `docker ps`, `docker exec`

> **Experiment Directory**  
> All screenshots are stored inside the `Image` folder. Paths are case‑sensitive.  
> ![Local folder](./Image/image.png)

---

### Part 1 – Docker Volumes: Persistent Data Storage

**Step 1.1 – The Ephemeral Nature of Container Data**

First, create a file inside a temporary container and observe that the data is lost once the container is removed.

```bash
docker run -it --name test-container ubuntu /bin/bash
# Inside container:
mkdir /data
echo "Hello World" > /data/message.txt
cat /data/message.txt   # Shows "Hello World"
exit
docker start test-container
docker exec test-container cat /data/message.txt   # File still present (container was not removed)
docker rm -f test-container
docker run -it --name test-container ubuntu /bin/bash
cat /data/message.txt   # "No such file or directory" – data is lost
```
![Data persistence demo and conflict](./Image/acer@DESKTOP-DOEGC13_%20_mnt_c_Users_acer%2027-02-2026%2000_22_33.png)

**Step 1.2 – Named Volumes**

Create a named volume, mount it, and verify that data survives container removal.

```bash
docker volume create mydata
docker volume ls

docker run -it --name volume-test \
  -v mydata:/data \
  ubuntu /bin/bash
echo "Persistent Data" > /data/test.txt
exit

docker rm volume-test
docker run -it --name volume-test2 \
  -v mydata:/data \
  ubuntu /bin/bash
cat /data/test.txt    # "Persistent Data" – data survived
exit
```
![Volume creation and persistent data test](./Image/acer@DESKTOP-DOEGC13_%20_mnt_c_Users_acer%2027-02-2026%2000_22_55.png)

**Step 1.3 – Bind Mounts (Host Directory)**

Share a folder between the host and a container so that both can read and write.

```bash
mkdir ~/myapp-data
docker run -d --name web3 \
  -v ~/myapp-data:/app/data \
  nginx

# Write from host
echo "From Host - Varun Experiment 5" > ~/myapp-data/host-file.txt
docker exec web3 cat /app/data/host-file.txt   # shows the host file

# Write from container
docker exec web3 sh -c "echo 'From Container Side' > /app/data/container-file.txt"
cat ~/myapp-data/container-file.txt            # shows the container file
```
![Bind mount bidirectional sync](./Image/Docker%20Permission%20Issue%20-%20Google%20Chrome%2027-02-2026%2000_28_20.png)

---

### Part 2 – Environment Variables

**Step 2.1 – Passing Variables at Runtime**

Modify the Flask app (`app.py`) to read configuration from environment variables, then run it with custom values.

```python
import os
from flask import Flask

app = Flask(__name__)

@app.route('/config')
def config():
    return {
        'database_host': os.environ.get('DATABASE_HOST', 'localhost'),
        'debug': os.environ.get('DEBUG', 'false'),
        'has_api_key': bool(os.environ.get('API_KEY'))
    }

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.environ.get('DEBUG') == 'true')
```

Build the image, then run with environment variables.

```bash
docker build --no-cache -t flask-app .
docker run -d -p 5000:5000 \
  -e DATABASE_HOST="prod-db.example.com" \
  -e DEBUG="true" \
  -e API_KEY="secret123" \
  flask-app
```
(If port 5000 is already in use, remove the old container first.)

![Adding env vars and resolving port conflict](./Image/Docker%20Permission%20Issue%20-%20Google%20Chrome%2027-02-2026%2000_28_58.png)

**Step 2.2 – Test the `/config` Endpoint**

Visit `http://localhost:5000/config` in a browser. The JSON response shows the injected values.

![Config endpoint JSON response](./Image/localhost_5000_config%20-%20Google%20Chrome%2027-02-2026%2000_34_57.png)

---

### Part 3 – Docker Monitoring

**Step 3.1 – Real‑time Resource Usage with `docker stats`**

```bash
docker stats --no-stream
```
Displays CPU, memory, network I/O for each running container.

![docker stats output](./Image/Docker%20Permission%20Issue%20-%20Google%20Chrome%2027-02-2026%2000_35_58.png)

**Step 3.2 – Application Logs with `docker logs`**

```bash
docker logs flask-app
```
Shows stdout/stderr from the Flask app (e.g., incoming requests, debug mode info).

![Flask container logs](./Image/Docker%20Permission%20Issue%20-%20Google%20Chrome%2027-02-2026%2000_36_17.png)

**Step 3.3 – Container Inspection**

```bash
docker inspect flask-app | grep -A 10 "NetworkSettings"
docker inspect --format='{{.State.Status}}' flask-app   # "running"
docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' flask-app  # 172.17.0.2
```
![docker inspect details](./Image/Docker%20Permission%20Issue%20-%20Google%20Chrome%2027-02-2026%2000_36_48.png)

---

### Part 4 – Docker Networks

**Step 4.1 – Create a Custom Bridge Network**

```bash
docker network create my-network
docker network inspect my-network
```
![Network creation and inspection](./Image/Docker%20Permission%20Issue%20-%20Google%20Chrome%2027-02-2026%2000_37_47.png)

**Step 4.2 – Run Containers on the Custom Network**

```bash
docker run -d --name web1 --network my-network nginx
docker run -d --name web2 --network my-network nginx
docker inspect --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' web2
```
![Network inspection with containers attached](./Image/Docker%20Permission%20Issue%20-%20Google%20Chrome%2027-02-2026%2000_39_39.png)

**Step 4.3 – Test Cross‑Container Communication**

Because the default `nginx` image does not include `ping`, spin up a temporary Ubuntu container on the same network and install `ping`.

```bash
docker run -it --network my-network ubuntu /bin/bash
apt update && apt install iputils-ping -y
ping web2   # resolves to 172.18.0.3 and gets replies
```
![Successful ping between containers on custom network](./Image/root@7976b8ae7c10_%20_%2027-02-2026%2000_41_59.png)

---

### 🧪 Quick Reference

| Area | Useful Commands |
|------|-----------------|
| **Volumes** | `docker volume create <name>`, `docker run -v vol:/path`, `docker volume ls`, `docker volume inspect <name>` |
| **Bind mounts** | `-v /host/path:/container/path` |
| **Environment** | `-e VAR=value`, `--env-file .env`, `ENV VAR=value` (in Dockerfile) |
| **Monitoring** | `docker stats`, `docker logs -f <container>`, `docker top <container>`, `docker inspect <container>` |
| **Networks** | `docker network create <name>`, `--network <name>`, `docker network connect/disconnect`, `docker network inspect` |
| **Port mapping** | `-p host:container`, `-p 80` (random host port) |

### ✅ Key Takeaways
- **Volumes** and **bind mounts** keep data alive beyond the container’s lifetime.
- **Environment variables** make containers configurable without rebuilding images.
- **Monitoring** commands help diagnose performance, logs, and current state.
- **Custom networks** allow containers to communicate by name and provide better isolation than the default bridge.
```