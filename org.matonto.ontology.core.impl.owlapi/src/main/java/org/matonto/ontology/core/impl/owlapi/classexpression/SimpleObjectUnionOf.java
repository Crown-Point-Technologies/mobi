package org.matonto.ontology.core.impl.owlapi.classexpression;

import java.util.Set;
import javax.annotation.Nonnull;
import org.matonto.ontology.core.api.classexpression.ClassExpression;
import org.matonto.ontology.core.api.classexpression.ObjectUnionOf;
import org.matonto.ontology.core.api.types.ClassExpressionType;


public class SimpleObjectUnionOf 
	extends SimpleClassExpression 
		implements ObjectUnionOf {

	public SimpleObjectUnionOf(@Nonnull Set<ClassExpression> operands) 
	{
		super(operands);
	}
	
	
	@Override
	public ClassExpressionType getClassExpressionType()
	{
		return ClassExpressionType.OBJECT_UNION_OF;
	}
	
	
	@Override
	public boolean equals(Object obj)
	{
		if (this == obj) {
			return true;
		}
		if (!super.equals(obj)) {
			return false;
		}
		
		return (obj instanceof SimpleObjectUnionOf);
	}
	

}