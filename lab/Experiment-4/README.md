The README I previously wrote used placeholder image names like `1.png`, `2.png`, etc. Your actual screenshots are stored in a folder named **`Image`** (singular) and have longer, descriptive file names – that’s why they don’t show up.

Below is the complete corrected README. It uses the **exact filenames** you provided, with spaces encoded as `%20` so they work in Markdown. Place this `README.md` inside your `Experiment-4` folder, and the images will display correctly on GitHub.

```markdown
## Lab Experiment 4: Docker Essentials – Dockerfile, .dockerignore, Tagging & Publishing

### Aim
To containerise a Python Flask application, understand Dockerfile instructions, `.dockerignore`, image tagging, layer caching, multi‑stage builds, and publishing to Docker Hub.

### Pre‑requisites
- Docker installed (used via WSL/Ubuntu)
- Python/Flask basics
- Terminal access

> **Project structure**  
> All files reside in `my-flask-app/`.
> ![Folder structure](./Image/image.png)

---

### Step‑by‑Step Procedure

**Step 1 – Create the project folder**  
```bash
mkdir my-flask-app
cd my-flask-app
```
![Creating directory](./Image/acer@DESKTOP-DOEGC13_%20_mnt_c_Users_acer_my-flask-app%2021-02-2026%2014_31_02.png)

**Step 2 – Write the Flask application (`app.py`)**  
```python
from flask import Flask
app = Flask(__name__)

@app.route('/')
def hello():
    return "Hello from Docker!"

@app.route('/health')
def health():
    return "OK"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```
![app.py in editor](./Image/Welcome%20-%20lab%20-%20Visual%20Studio%20Code%2021-02-2026%2014_32_58.png)

**Step 3 – `requirements.txt`**  
```
Flask==2.3.3
```
![File explorer showing all files](./Image/Welcome%20-%20lab%20-%20Visual%20Studio%20Code%2021-02-2026%2014_33_04.png)

**Step 4 – Create the Dockerfile**  
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
EXPOSE 5000
CMD ["python", "app.py"]
```
![Dockerfile content](./Image/Welcome%20-%20lab%20-%20Visual%20Studio%20Code%2021-02-2026%2014_32_55.png)

**Step 5 – `.dockerignore`**  
```
__pycache__/
*.pyc
.env
.venv
env/
venv/
.vscode/
.idea/
.git/
.gitignore
.DS_Store
Thumbs.db
*.log
logs/
tests/
test_*.py
```
![.dockerignore content](./Image/requirements.txt%20-%20lab%20-%20Visual%20Studio%20Code%2021-02-2026%2014_33_37.png)

**Step 6 – First build attempt (credential error)**  
`docker build` fails because the Docker config inside WSL points to `desktop.exe`.
```bash
docker build -t my-flask-app .
```
![Build error](./Image/Screenshot%2021-02-2026%2015_05_07.png)

**Step 7 – Fix the credential issue**  
Remove the broken Docker config and restart WSL.
```bash
rm -rf ~/.docker
exit
wsl --shutdown   # in PowerShell
wsl
cd /mnt/c/Users/acer/my-flask-app
```
![Removing config](./Image/Docker%20Permission%20Issue%20-%20Google%20Chrome%2021-02-2026%2015_15_35.png)  
![Restarting WSL](./Image/acer@DESKTOP-DOEGC13_%20_mnt_c_Users_acer_my-flask-app%2021-02-2026%2015_15_22.png)

**Step 8 – Rebuild successfully**  
Now the build completes and creates the image.
```bash
docker build --no-cache -t my-flask-app .
docker images
```
![Rebuilding after fix](./Image/acer@DESKTOP-DOEGC13_%20_mnt_c_Users_acer_my-flask-app%2021-02-2026%2015_17_31.png)  
![Build finished](./Image/acer@DESKTOP-DOEGC13_%20_mnt_c_Users_acer_my-flask-app%2021-02-2026%2015_17_57.png)  
![Image list](./Image/Docker%20Permission%20Issue%20-%20Google%20Chrome%2021-02-2026%2015_18_31.png)

**Step 9 – Run the container and test**  
```bash
docker run -d -p 5000:5000 --name flask-container my-flask-app
```
Open `http://localhost:5000` – you should see **“Hello from Docker!”**.
![Browser output](./Image/acer@DESKTOP-DOEGC13_%20_mnt_c_Users_acer_my-flask-app%2021-02-2026%2015_18_49.png)

**Step 10 – Make a code change and rebuild (demonstrating layer caching)**  
Edit `app.py`, then rebuild. Notice how unchanged layers (like `pip install`) are cached.
```bash
nano app.py
docker build -t my-flask-app .
docker rm -f flask-container
docker run -d -p 5000:5000 --name flask-container my-flask-app
```
![Rebuild with cache](./Image/acer@DESKTOP-DOEGC13_%20_mnt_c_Users_acer_my-flask-app%2021-02-2026%2015_24_33.png)  
![Running new container](./Image/acer@DESKTOP-DOEGC13_%20_mnt_c_Users_acer_my-flask-app%2021-02-2026%2015_24_35.png)

**Step 11 – Tagging for versioning and registry**  
```bash
docker tag my-flask-app:latest username/my-flask-app:1.0
docker tag my-flask-app:latest username/my-flask-app:latest
```

**Step 12 – Publish to Docker Hub**  
```bash
docker login
docker push username/my-flask-app:1.0
docker push username/my-flask-app:latest
```

**Step 13 – Multi‑stage build (optional)**  
A multi‑stage Dockerfile reduces the final image size by separating build and runtime stages.
```dockerfile
# STAGE 1: Builder
FROM python:3.9-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user -r requirements.txt

# STAGE 2: Runtime
FROM python:3.9-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY app.py .
ENV PATH=/root/.local/bin:$PATH
EXPOSE 5000
CMD ["python", "app.py"]
```
Build and compare sizes:
```bash
docker build -f Dockerfile.multistage -t my-flask-app:multistage .
docker images | grep my-flask-app
```

---

### 🔍 Key Concepts

| Term | Description |
|------|-------------|
| **Dockerfile** | Declarative instructions to build an image |
| **.dockerignore** | Prevents sending unnecessary files to the build context |
| **Layer caching** | Docker reuses unchanged layers for faster rebuilds |
| **Tag** | A label attached to an image (e.g., `v1.0`, `latest`) |
| **Multi‑stage build** | Uses multiple `FROM` statements to keep production images lean |
| **Registry** | Storage for images (Docker Hub, AWS ECR, etc.) |

### ✅ Result
A complete Flask application was containerised. The Docker credential issue was resolved, the image was built and run successfully, layer caching was observed, and the concepts of tagging and multi‑stage builds were understood. The app served correctly on `http://localhost:5000`.
```

Once you save this as `README.md` inside `Experiment-4`, all images will reference the exact file names in your `Image` folder. If you later rename the folder to `Images`, just update all `./Image/` prefixes to `./Images/`.