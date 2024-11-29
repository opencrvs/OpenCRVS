# Load extensions for configmap/secret/namespace operations
load('ext://configmap', 'configmap_create')
load('ext://secret', 'secret_create_generic', 'secret_from_dict')
load('ext://namespace', 'namespace_create', 'namespace_inject')
load('ext://helm_resource', 'helm_resource', 'helm_repo')

# Disable parallel updates, default 3
update_settings(max_parallel_updates=2)

# Only use for local dev with docker desktop
allow_k8s_contexts('docker-desktop')


# Build baseimage
docker_build("opencrvs/ocrvs-base", ".", dockerfile="packages/Dockerfile.base", only=["packages/commons","package.json","yarn.lock"], network="host")

# Build services
docker_build("opencrvs/ocrvs-client:local", "packages", dockerfile="packages/client/Dockerfile", only=["components","client","events","gateway"], network="host")
docker_build("opencrvs/ocrvs-login:local", "packages", dockerfile="packages/login/Dockerfile", only=["components","login"], network="host")
docker_build("opencrvs/ocrvs-gateway:local", "packages", dockerfile="packages/gateway/Dockerfile", only=["components","gateway", "events"], network="host")

apps = ['auth', 
              'config',
              'dashboards', 
              'documents', 
              'events',
              'metrics', 
              'migration', 
              'notification', 
              'scheduler', 
              'search', 
              'user-mgnt', 
              'webhooks', 
              'workflow']

def build_services():
  for app in apps:
    docker_build("opencrvs/ocrvs-{}:local".format(app), "packages/{}".format(app), network="host")

build_services()


# Create namespace
namespace_create('traefik')
namespace_create('opencrvs-deps-dev')
namespace_create('opencrvs-services-dev')

# Install Traefik GW
helm_repo('traefik-repo', 'https://traefik.github.io/charts')
helm_resource('traefik', 'traefik-repo/traefik', resource_deps=['traefik-repo'], flags=['--values=kubernetes/traefik/values.yaml'])

# Create auth keys in k8s
secret_create_generic('private-key', from_file='.secrets/private-key.pem', namespace="opencrvs-services-dev")
configmap_create('public-key', from_file=['.secrets/public-key.pem'], namespace="opencrvs-services-dev")

# Deploy dependencies with Helm
k8s_yaml(helm('kubernetes/dependencies',
              namespace='opencrvs-deps-dev', 
              values=['kubernetes/dependencies/values.yaml', 
                      'kubernetes/dependencies/values-dev.yaml']))


# Deploy services with Helm
k8s_yaml(helm('kubernetes/opencrvs-services',
              namespace='opencrvs-services-dev', 
              values=['kubernetes/opencrvs-services/values.yaml', 
                      'kubernetes/opencrvs-services/values-dev.yaml']))


#def wait_for_builds():
#  for app in apps:
#    resources_to_be_waited = 
#    k8s_resource(app, resource_deps=["opencrvs/ocrvs-{}:local".format(app))

#wait_for_builds()
