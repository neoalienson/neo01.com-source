---
title: Interacting with Docker Containers - Shell and SSH
date: 2024-7-4
categories:
  - Development
tag:
  - docker
thumbnail: banner.jpeg
thumbnail_80: icon.jpeg
spell_checked: 2025-07-01
grammar_checked: 2025-07-02
excerpt: Shell and SSH access to containers is convenient, but why are they bad for Docker? Explore the security risks and better alternatives for container interaction.
comments: true
---


Docker has revolutionized the way we build, ship, and run applications by encapsulating them in lightweight, portable containers. Interacting with these containers with shell and SSH is not the best practice but convenient for developers. In this blog post, we'll explore how to interact with Docker containers using shell access and SSH.

### Shell Access to Containers

The most straightforward method to interact with a running Docker container is through the Docker exec command, in case you build the image with shell. This command allows you to run a new command in a running container, which is especially useful for debugging or quick modifications.

Here's how you can use it:

1. **Identify the Container**: First, you need to know the container's ID or name. You can list all running containers with `docker ps`.

2. **Execute a Command**: To run a command inside the container, use `docker exec`. For example, to start an interactive shell session, you can use:
   ```
   docker exec -it <container_id_or_name> /bin/sh
   ```
   Replace `<container_id_or_name>` with your actual container ID or name. The `-it` flags attach an interactive tty in the container.

:warning: **Maintain Security**: Remember that building a container image with unnecessary components, especially a shell, can pose a security risk. Always build the image `FROM scratch` to keep it clean and integrate with observability for troubleshooting.

### SSH into Containers

While shell access is convenient, sometimes you may need a more persistent connection method, like SSH. Setting up SSH access to a Docker container involves a few more steps:

1. **Create a Dockerfile**: You'll need a Dockerfile that installs SSH and sets up the necessary configurations. Here's a simple example:
   ```
   FROM ubuntu:latest
   RUN apt-get update && apt-get install -y openssh-server
   RUN mkdir /var/run/sshd
   RUN echo 'root:YOUR_PASSWORD' | chpasswd
   RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
   EXPOSE 22
   CMD ["/usr/sbin/sshd", "-D"]
   ```
   Replace `YOUR_PASSWORD` with a secure password of your choice.

2. **Build and Run the Container**: Build the image with `docker build` and run it with `docker run`, making sure to map the SSH port:
   ```
   docker build -t ssh-enabled-container .
   docker run -d -p 2222:22 ssh-enabled-container
   ```

3. **SSH into the Container**: Use an SSH client to connect to the container:
   ```
   ssh root@localhost -p 2222
   ```
   Use the password you set in the Dockerfile to log in.

:warning: **Maintain Security**: Remember that exposing SSH in a container can be a security risk. Always use strong passwords or SSH keys, and consider additional security measures like firewalls and SSH hardening practices. There are other dangerous ways to access the SSH port but we will not go further in this post.

### Why Shell and SSH are bad for Docker

When you SSH into a container, you're essentially treating it like a traditional virtual machine, which goes against the container philosophy of **isolated**, **ephemeral**, and minimalistic environments. 

1. **Security Risks**: SSH servers add unnecessary complexity and potential vulnerabilities to your container. Each SSH process running in a container is an additional attack surface for malicious actors.

2. **Container Bloat**: Containers are meant to be lightweight and contain only the essential packages needed to run the application. Installing an SSH server and shell increases the size of the container and adds extra layers that are not necessary for the application to function.

3. **Deviation from Container Orchestration Tools**: Modern container orchestration tools like Kubernetes provide their own methods for accessing containers, such as `kubectl exec`. Using SSH and shell can bypass these tools, leading to a deviation from standardized workflows and potentially causing configuration drift.

4. **Statefulness**: Containers are designed to be stateless and immutable. SSH'ing and shell into a container and making changes can lead to a stateful configuration that is not reflected in the container's image or definition files. This can cause issues when the container is redeployed or scaled across different environments.

5. **Lifecycle Management**: Docker containers are meant to be stopped and started frequently, with changes being made through updates to the container image. By using SSH and shell, you might be tempted to make ad-hoc changes to the running container, which is against the principles of immutable infrastructure.

6. **Complexity in Management**: Managing SSH keys, ensuring they are rotated and kept secure, adds an additional layer of complexity to container management. It also increases the administrative overhead of managing access to containers.

### Conclusion

Whether you prefer the simplicity of Docker exec or the persistence of SSH, both methods provide robust ways to interact with your Docker containers. Remember to use these tools responsibly, keeping security in mind, and you'll be able to manage your containers effectively.

We hope this guide has been helpful. For more detailed instructions and best practices, refer to the official Docker documentation and SSH configuration guides. Happy containerizing!

![](hero.jpeg)
