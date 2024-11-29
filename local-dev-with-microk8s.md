# Local development with Kubernetes

This guide is for Ubuntu laptop. On Macbook you should use either `Docker Desktop` or `OrbStack` - both come with their builtin k8s.

## Install Docker

Follow the [offical guide](https://docs.docker.com/engine/install/ubuntu/)

Also follow the [post-install steps](https://docs.docker.com/engine/install/linux-postinstall/) to enable your local user to be able to directly interact with Docker.

## Install MicroK8s

Follow the [official guide](https://microk8s.io/docs/getting-started) for install.

Pay attention to also the `Join the group` - eg enable local user to be able to use it steps.

After its completed install following plugins

- dns
- metallb (please use `microk8s enable metallb:10.12.13.0/24`)
- registry
- dashboard (optional)

You might also benefit from creating alias for this clusters `kubectl` by doing `alias kubectl='microk8s kubectl'`