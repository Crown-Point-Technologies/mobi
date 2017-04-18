#MatOnto Distribution

## Docker
Specify the `docker:build` target when running your mvn operation in order
to use the currently building distribution to generate a docker image.  This
means that if you specify this target, you can then run a docker image 
containing the distribution just built.

To run your docker container after building it: 
`docker run --name MatOnto -p 8443:8443 -d matonto/matonto`

### Docker Deployment
In order to deploy tags of the docker container to DockerHub, you 
must first be part of the DockerHub MatOnto project.  Then, you can run
`mvn docker:build -DpushImageTag` to push tags of the MatOnto docker image
to the hub.  Key to this configuration is to provide maven your DockerHub
credentials.  To do this, add an entry in the `<servers>` entry of your
`~/.m2/settings.xml`:

```
<server>
  <id>docker-hub</id>
  <username>{username}</username>
  <password>{J0QfBsYxFCkHKWpkA+b74DH72XwUaxvgCEPYltmTRfk=}</password>
  <configuration>
    <email>bdgould@smcm.edu</email>
  </configuration>
</server>
```

Note: If you want to encrypt your maven passwords in your 
settings.xml file, please refer to: 
https://maven.apache.org/guides/mini/guide-encryption.html