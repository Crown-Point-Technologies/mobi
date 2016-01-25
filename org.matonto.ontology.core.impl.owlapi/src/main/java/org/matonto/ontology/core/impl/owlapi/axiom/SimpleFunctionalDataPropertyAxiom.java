package org.matonto.ontology.core.impl.owlapi.axiom;

import java.util.Set;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.Annotation;
import org.matonto.ontology.core.api.propertyexpression.DataPropertyExpression;
import org.matonto.ontology.core.api.axiom.FunctionalDataPropertyAxiom;
import org.matonto.ontology.core.api.types.AxiomType;


public class SimpleFunctionalDataPropertyAxiom 
	extends SimpleAxiom 
	implements FunctionalDataPropertyAxiom {

	
	public DataPropertyExpression property;
	
	
	public SimpleFunctionalDataPropertyAxiom(@Nonnull DataPropertyExpression property, Set<Annotation> annotations) 
	{
		super(annotations);
		this.property = property;
	}

	
	@Override
	public FunctionalDataPropertyAxiom getAxiomWithoutAnnotations() 
	{
		if(!isAnnotated())
			return this;
		
		return new SimpleFunctionalDataPropertyAxiom(property, NO_ANNOTATIONS);	
	}
	

	@Override
	public FunctionalDataPropertyAxiom getAnnotatedAxiom(@Nonnull Set<Annotation> annotations) 
	{
		return new SimpleFunctionalDataPropertyAxiom(property, mergeAnnos(annotations));
	}

	
	@Override
	public AxiomType getAxiomType()
	{
		return AxiomType.FUNCTIONAL_DATA_PROPERTY;
	}

	
	@Override
	public DataPropertyExpression getDataProperty() 
	{
		return property;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) 
		    return true;
		
		if (!super.equals(obj)) 
			return false;
		
		if (obj instanceof FunctionalDataPropertyAxiom) {
			FunctionalDataPropertyAxiom other = (FunctionalDataPropertyAxiom)obj;			 
			return property.equals(other.getDataProperty());
		}
		
		return false;
	}

}