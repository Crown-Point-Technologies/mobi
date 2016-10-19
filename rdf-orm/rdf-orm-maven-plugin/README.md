# MatOnto RDF ORM Maven Plugin
This maven plugin is a more simple, convenient way to generate your MatOnto
RDF ORM source code.  Basically you can configure your project to point at a
necessary ontology file (including any imported ontologies), and then tell it
where you want to write your source code.  Once you run maven install on your
project, the source will automatically be generated.

Example configuration in your pom:
```xml
<plugin>
    <groupId>org.matonto.orm</groupId>
    <artifactId>rdf-orm-maven-plugin</artifactId>
    <version>${version}</version>
    <executions>
        <execution>
            <id>generateOrmSources</id>
            <phase>generate-sources</phase>
            <goals>
                <goal>generate-orm</goal>
            </goals>
            <inherited>false</inherited>
            <configuration>
                <!-- Ontologies listed in the generates section will generate source code -->
                <generates>
                    <ontology>
                        <!-- The file containing the ontology RDF -->
                        <ontologyFile>${project.basedir}/src/main/resources/ontology.trig</ontologyFile>
                        <!-- The package name representing this ontology (the package the ontology will be generated in) -->
                        <outputPackage>org.matonto.ontology</outputPackage>
                    </ontology>
                </generates>
                <!-- Ontologies listed in the references section will act as references for the generated source, but won't create Java files. -->
                <references>
                    <ontology>
                        <!-- The file containing the ontology RDF -->
                        <ontologyFile>${project.basedir}/src/main/resources/importedOntology.rdf</ontologyFile>
                        <!-- The package that references should use for this ontology data -->
                        <outputPackage>org.matonto.ontology.reference</outputPackage>
                    </ontology>
                </references>
                <!-- The location you want to write your Java classes to -->
                <outputLocation>${project.basedir}/src/test/java</outputLocation>
            </configuration>
        </execution>
    </executions>
</plugin>
```
