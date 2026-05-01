```markdown
## Lab Experiment 3: Deploying NGINX Using Different Base Images and Comparing Image Layers

### Aim
To deploy NGINX using three different approaches (official image, Ubuntu‑based image, Alpine‑based image), compare image sizes and layers, and understand how the choice of base image affects performance, security, and resource usage.

<hr>

<h4 align="center"> Pre‑requisite </h4>

- Docker installed and running (using `sudo` if required)
- Basic knowledge of `docker run`, `Dockerfile`, and port mapping
- WSL / Linux terminal (the lab uses Ubuntu in WSL)

> **Directory overview**  
> The experiment directory contains Dockerfiles, a custom `html` folder, and a `test_lab` subfolder.
>
> ![Experiment directory](./Images/image.png)

<hr>

### Step‑by‑Step Procedure

---

**Step 1 – Pull the Official NGINX Image**  
Because the user is not yet in the `docker` group, `sudo` is required. The official `nginx:latest` image is pulled from Docker Hub.

```bash
sudo docker pull nginx:latest
sudo docker images
```
![Pulling official nginx image](./Images/acer@DESKTOP-DOEGC13_%20_mnt_c_Users_acer_OneDrive_Desktop_Cloud%20Lab_Containerization-and-Devops-Lab-_lab_Experiment-3%2007-02-2026%2014_35_43.png)

---

**Step 2 – Run the Official NGINX Container**  
Start a container from the official image, mapping port **8080** on the host to port **80** inside the container.

```bash
sudo docker run -d --name nginx-official -p 8080:80 nginx
curl http://localhost:8080
```
*(The first `curl` attempt may fail with “connection reset” while the container is still starting; repeating the `curl` after a few seconds returns the welcome page.)*

![Running official nginx](./Images/acer@DESKTOP-DOEGC13_%20_mnt_c_Users_acer_OneDrive_Desktop_Cloud%20Lab_Containerization-and-Devops-Lab-_lab_Experiment-3%2007-02-2026%2014_38_23.png)

---

**Step 3 – Create a Dockerfile for Ubuntu‑Based NGINX**  
Use `nano` to write a `Dockerfile.ubuntu` that installs NGINX on top of Ubuntu 22.04.

```dockerfile
FROM ubuntu:22.04

RUN apt-get update && \
    apt-get install -y nginx && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```
![Editing Dockerfile.ubuntu in nano](./Images/Deploy%20NGINX%20with%20Different%20Base%20Images%20Guide%20-%20DeepSeek%20-%20Google%20Chrome%2007-02-2026%2014_38_42.png)
![Dockerfile content](./Images/Deploy%20NGINX%20with%20Different%20Base%20Images%20Guide%20-%20DeepSeek%20-%20Google%20Chrome%2007-02-2026%2014_39_05.png)

---

**Step 4 – Build and Run the Ubuntu‑Based NGINX Image**  

```bash
sudo docker build -t nginx-ubuntu -f Dockerfile.ubuntu .
sudo docker run -d --name nginx-ubuntu -p 8081:80 nginx-ubuntu
curl http://localhost:8081
sudo docker images nginx-ubuntu
```
![Commands for building Ubuntu image](./Images/Deploy%20NGINX%20with%20Different%20Base%20Images%20Guide%20-%20DeepSeek%20-%20Google%20Chrome%2007-02-2026%2014_39_35.png)
![Build result and image size (134MB)](./Images/acer@DESKTOP-DOEGC13_%20_mnt_c_Users_acer_OneDrive_Desktop_Cloud%20Lab_Containerization-and-Devops-Lab-_lab_Experiment-3%2007-02-2026%2014_44_04.png)

---

**Step 5 – Create a Dockerfile for Alpine‑Based NGINX**  
Write a `Dockerfile.alpine` using the lightweight Alpine Linux base.

```dockerfile
FROM alpine:latest
RUN apk add --no-cache nginx
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```
![Editing Dockerfile.alpine](./Images/Deploy%20NGINX%20with%20Different%20Base%20Images%20Guide%20-%20DeepSeek%20-%20Google%20Chrome%2007-02-2026%2014_44_59.png) *(scene before build)*

---

**Step 6 – Build and Run the Alpine‑Based NGINX Image**  

```bash
sudo docker build -t nginx-alpine -f Dockerfile.alpine .
sudo docker run -d --name nginx-alpine -p 8082:80 nginx-alpine
curl http://localhost:8082
sudo docker images nginx-alpine
```
![Alpine image size (10.4MB)](./Images/acer@DESKTOP-DOEGC13_%20_mnt_c_Users_acer_OneDrive_Desktop_Cloud%20Lab_Containerization-and-Devops-Lab-_lab_Experiment-3%2007-02-2026%2014_45_35.png)

---

**Step 7 – Inspect Image Layers with `docker history`**  
Compare the layers of the three images to understand why sizes differ.

```bash
sudo docker history nginx
sudo docker history nginx-ubuntu
sudo docker history nginx-alpine
```

- **Official NGINX** – many intermediate layers (pre‑optimised Debian base) → **161 MB**
- **NGINX‑Ubuntu** – full Ubuntu filesystem plus NGINX installation → **134 MB**
- **NGINX‑Alpine** – minimal Alpine rootfs + NGINX package → **10.4 MB**

![Detailed layer output for all images](./Images/acer@DESKTOP-DOEGC13_%20_mnt_c_Users_acer_OneDrive_Desktop_Cloud%20Lab_Containerization-and-Devops-Lab-_lab_Experiment-3%2007-02-2026%2014_45_32.png)
![Side‑by‑side history and final sizes](./Images/acer@DESKTOP-DOEGC13_%20_mnt_c_Users_acer_OneDrive_Desktop_Cloud%20Lab_Containerization-and-Devops-Lab-_lab_Experiment-3%2007-02-2026%2014_45_35.png)

---

**Step 8 – Serve a Custom HTML Page (Volume Mount)**  
Create a simple `index.html` and mount it into the default NGINX web root.

```bash
mkdir html
echo "<h1>Hello from Docker NGINX</h1>" > html/index.html
sudo docker run -d -p 8083:80 -v $(pwd)/html:/usr/share/nginx/html nginx
```
![index.html content and project structure](./Images/acer@DESKTOP-DOEGC13_%20_mnt_c_Users_acer_OneDrive_Desktop_Cloud%20Lab_Containerization-and-Devops-Lab-_lab_Experiment-3_test_lab%2007-02-2026%2015_01_48.png)
![Containers running with volume mount](./Images/acer@DESKTOP-DOEGC13_%20~_nginx_lab%2007-02-2026%2015_05_06.png)

---

**Step 9 – Add a Health Check to the Alpine Image (Extension)**  
Create a `Dockerfile.health` that includes the `HEALTHCHECK` instruction for Docker to monitor the container.

```dockerfile
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/
HEALTHCHECK --interval=5s --timeout=3s --start-period=5s --retries=3 CMD wget -q --spider http://localhost/ || exit 1
```

Build the image and run the container on port **8085**:

```bash
cd ~/nginx_lab
sudo docker build -t nginx-health -f Dockerfile.health .
sudo docker run -d -p 8085:80 --name nginx-final nginx-health
sleep 5
curl http://localhost:8085
```

![Building the health‑checked image](./Images/acer@DESKTOP-DOEGC13_%20_mnt_c_Users_acer_OneDrive_Desktop_Cloud%20Lab_Containerization-and-Devops-Lab-_lab_Experiment-3_test_lab%2007-02-2026%2014_57_22.png)
![Final test and container status](./Images/index.html%20-%20Experiment-3%20-%20Visual%20Studio%20Code%2007-02-2026%2015_03_36.png)

---

**Step 10 – Final Summary of All NGINX Images**  
List all containers and images to observe the size differences.

```bash
sudo docker ps
sudo docker images | grep nginx
```

![Final containers and image list](./Images/acer@DESKTOP-DOEGC13_%20~_nginx_lab%2007-02-2026%2015_09_27.png)

The final image sizes are:

| Image            | Size    |
|------------------|---------|
| `nginx` (official) | 161 MB  |
| `nginx-ubuntu`   | 134 MB  |
| `nginx-alpine`   | 10.4 MB |
| `nginx-health`   | 62.1 MB |

---

### 🔍 Key Observations

- **Official NGINX** is pre‑optimised and ready for production, but still larger than an Alpine‑based build.
- **Ubuntu‑based** image includes a complete operating system, leading to the largest size and longest build time. It is useful for debugging or when additional system tools are needed.
- **Alpine‑based** image is **~10 MB**, contains only the bare minimum, starts almost instantly, and has a smaller security surface – ideal for microservices and CI/CD pipelines.
- The **health check** adds a small layer that allows Docker to monitor the container’s state, improving reliability in orchestrated environments.

---

### ✅ Result
Successfully deployed NGINX from three different base images, inspected their layers, understood the trade‑offs between size, flexibility, and security, and demonstrated a real‑world scenario with a custom HTML page and a health check.
```