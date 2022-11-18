# NASA Image Of The Day
Simple project that fetches Nasa's image of the day based on a user-specified date and display image in the browser.

## Building
Building source code is not required as it can just be executed by `node`. To build the docker image, run:
```sh
docker build -t dimaj/nasa-images:1.0.0-$(uname -m)
```
Command above builds a docker image and:
* uses `dimaj/nasa-images` as a repository
* tags it with version `1.0.0` with your system's architecture added. This is mainly used if you are building on a ARM machine and deploying to AMD nodes in kubernetes.


## Running
There are 2 ways of running:
* From local machine
* Using Docker

### Docker
If image has been built using docker, application can be launched using:
```sh
docker run --name nasa-iotd -p 8080:8080 -e API_KEY=DEMO_KEY dimaj/nasa-images:1.0.0-$(uname -m)
```
This command is going to create a docker container with:
* `--name nasa-iotd` - sets container name `nasa-iotd` (nasa-image of the day)
* `-p 8080:8080` - maps local port `8080` to container's port `8080`
* `-e API_KEY=DEMO_KEY` - sets an environment variable `API_KEY` in the container to `DEMO_KEY`
* `dimaj/nasa-images:1.0.0-$(uname -m)` - specifies image and tag to use

### Local
To run locally, you need to enure that your computer has `node` and `npm` or `yarn` installed. Once those requirements have been satisfied, run:
```sh
# if using `npm`
npm install
# if using `yarn`
yarn install
```
Then, application can be started by:
```sh
API_KEY=DEMO_KEY SERVER_PORT=8080 HEALTH_PORT=8081 node index.js
```
where:
* `API_KEY=DEMO_KEY` - is required to make api requests against NASA's services. If you have your own API key, replace `DEMO_KEY` with your key
* `SERVER_PORT=8080` - sets main web server's port to `8080`. This is optional and will default to `8080` if not passed in.
* `HEALTH_PORT=8081` - sets healthcheck port to `8081`. This is optional and wll default to `8081` if not passed in.
* `node index.js` - actual application execution using locally installed `node`

## Using application
Once your application is running (either via docker or node), it can be accessed by navingating to: `http://localhost:8080?date=2020-01-01`
Where, `date=2020-01-01` is a query parameter that ***MUST*** be in a `YYYY-mm-dd` form. Anything other than that, will result in the following response:
```
{
  "status": "error",
  "message": "failed to fetch NASA image of the day",
  "reason": "Error: Date is a required argument and must be in a form: %Y-%m-%d. (e.g. 2012-01-17)"
}
```

Deploying
---
Deployment is as easy as building images.
```sh
helm upgrade --install --set image.tag=1.0.0-amd --set api_key=DEMO_KEY <release name> nasa-image
# or, if custom registry was used
helm upgrade --install --set image.tag=1.0.0-amd --set api_key=DEMO_KEY --set image.repository=your.custom.repo/url/nasa-images deploy
```
or, if you prefer to use make:
```sh
make VERSION=1.0.0-amd API_KEY=DEMO_KEY deploy
# or, if custom registry was used
make VERSION=1.0.0-amd API_KEY=DEMO_KEY DOCKER_IMG_BASE=your.custom.repo/url deploy
```

## Other information
* This is a very simplistic approach to the deployment. If your cluster has Istio Service Mesh deployed into it, extra manifests could be added to the helm chart:
  * Gateway - Responsible for accepting connection and, if required, terminate SSL
  * VirtualService - At bare minimum responsible for connecting Gateway to Service. 

* If your cluster has Cert-Manager deployed, a SSL Certificate could be requested and application could be configured to use that certificate to ensure secure connection.
  * NOTE: If both istio and cert-manager are being used, all certificates must be added to istio's namespace (unless istio has permissions to access any namespace in the cluster)

* If you want application itself to terminate SSL:
  * Application has to be updated to handle SSL
  * Deployment template should be updated to use a `Secret` resource to inject ssl certificate and ssl certificate key into the container.
* In the ideal scenario, there should be unit tests added to the server to ensure that it operates the way it supposed to.

* Kubernetes deployment should be more security oriented
  * Container user should be mapped to a non-root user on node.
  * NodeAffinity/Anti-Affinity could be used to make sure that this application is deployed to a specific set of nodes
  * `Secret` resources could be used to store NASA API_KEY and inject it into the container using:
    ```yaml
    env:
      - name: API_KEY
        valueFrom:
          secretKeyRef:
            name: api-secret-name
            key: secret-field
    ```
  * `ConfigMap` resource could be used to pass in other configuration information that might be required by the application. (e.g. port numbers)