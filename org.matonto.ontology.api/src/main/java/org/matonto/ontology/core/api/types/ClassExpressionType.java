package org.matonto.ontology.core.api.types;

import javax.annotation.Nonnull;

import org.matonto.rdf.api.IRI;
import org.matonto.rdf.api.ValueFactory;
import aQute.bnd.annotation.component.Reference;


public enum ClassExpressionType {
	OWL_CLASS("Class"), 
	OBJECT_SOME_VALUES_FROM("ObjectSomeValuesFrom"), 
	OBJECT_ALL_VALUES_FROM("ObjectAllValuesFrom"), 
	OBJECT_MIN_CARDINALITY("ObjectMinCardinality"), 
	OBJECT_MAX_CARDINALITY("ObjectMaxCardinality"), 
	OBJECT_EXACT_CARDINALITY("ObjectExactCardinality"), 
	OBJECT_HAS_VALUE("ObjectHasValue"), 
	OBJECT_HAS_SELF("ObjectHasSelf"), 
	DATA_SOME_VALUES_FROM("DataSomeValuesFrom"), 
	DATA_ALL_VALUES_FROM("DataAllValuesFrom"), 
	DATA_MIN_CARDINALITY("DataMinCardinality"), 
	DATA_MAX_CARDINALITY("DataMaxCardinality"), 
	DATA_EXACT_CARDINALITY("DataExactCardinality"), 
	DATA_HAS_VALUE("DataHasValue"), 
	OBJECT_INTERSECTION_OF("ObjectIntersectionOf"), 
	OBJECT_UNION_OF("ObjectUnionOf"), 
	OBJECT_COMPLEMENT_OF("ObjectComplementOf"), 
	OBJECT_ONE_OF("ObjectOneOf");

	private final String name;
	private final String prefixedName;
	private final IRI iri;
    private static ValueFactory factory;
    
    @Reference
    protected void setValueFactory(final ValueFactory vf)
    {
        factory = vf;
    }
    
	ClassExpressionType(@Nonnull String name) {
		this.name = name;
		prefixedName = ("owl" + ':' + name);
		iri = createIRI("http://www.w3.org/2002/07/owl#", name);
	}
	
	private IRI createIRI(String namespace, String localName)
    {
        return factory.createIRI(namespace.toString(), localName);
    }
   
	public String getName()
	{
		return name;
	}
	
	
	public String toString()
	{
		return name;
	}
	
	
	public String getShortForm()
	{
		return name;
	}
	
	
	public IRI getIRI()
	{
		return iri;
	}
	
	
	public String getPrefixedName()
	{
		return prefixedName;
	}
 }